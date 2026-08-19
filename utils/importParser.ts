/**
 * CSV / Excel Parser & Validator for Bulk Expense Import in BudgetWise
 */
import * as XLSX from 'xlsx';
import { resolveSmartCategory } from './smartCategoryResolver';

export interface ParsedImportRow {
  rowNumber: number;
  rawDate: string;
  rawAmount: string;
  rawCategory: string;
  rawPaymentMethod: string;
  rawDescription: string;
  
  // Parsed & Normalized
  date: string | null; // YYYY-MM-DD
  amount: number | null;
  categoryName: string;
  isCategoryExplicit: boolean;
  isCategoryConfident: boolean;
  paymentMethodName: string;
  description: string;
  
  isValid: boolean;
  errorReason: string | null;
}

/**
 * Strips currency symbols, commas, and whitespace from amount string
 * @example cleanAmountString("₹1,250.50") → 1250.5
 */
export function parseAmount(val: string): { amount: number | null; error: string | null } {
  if (!val || !val.trim()) {
    return { amount: null, error: 'Amount is missing' };
  }
  const cleaned = val.replace(/[^0-9.-]/g, '').trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) {
    return { amount: null, error: `Invalid amount: "${val}"` };
  }
  if (num <= 0) {
    return { amount: null, error: `Amount must be greater than 0` };
  }
  return { amount: Math.round(num * 100) / 100, error: null };
}

/**
 * Normalizes input date into YYYY-MM-DD
 * Parses DD/MM/YYYY dates strictly as Day/Month/Year
 */
export function parseDateString(val: string): { date: string | null; error: string | null } {
  if (!val || !val.trim()) {
    return { date: null, error: 'Date is missing' };
  }
  const trimmed = val.trim();

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (isValidDate(y, m, d)) {
      return { date: formatDateISO(y, m, d), error: null };
    }
    return { date: null, error: `Invalid date: "${trimmed}"` };
  }

  // Pattern 2: DD/MM/YYYY or DD-MM-YYYY (Strict Indian/UK DD/MM/YYYY)
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10); // Day
    const p2 = parseInt(dmyMatch[2], 10); // Month
    const y = parseInt(dmyMatch[3], 10);  // Year

    if (isValidDate(y, p2, p1)) {
      return { date: formatDateISO(y, p2, p1), error: null };
    }
    if (isValidDate(y, p1, p2)) {
      return { date: formatDateISO(y, p1, p2), error: null };
    }
    return { date: null, error: `Invalid date: "${trimmed}"` };
  }

  // Excel numeric date fallback (e.g. 45678)
  if (!isNaN(Number(trimmed)) && Number(trimmed) > 35000) {
    const excelDate = XLSX.SSF.parse_date_code(Number(trimmed));
    if (excelDate && isValidDate(excelDate.y, excelDate.m, excelDate.d)) {
      return { date: formatDateISO(excelDate.y, excelDate.m, excelDate.d), error: null };
    }
  }

  // Standard JS Date fallback
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    if (isValidDate(y, m, day)) {
      return { date: formatDateISO(y, m, day), error: null };
    }
  }

  return { date: null, error: `Invalid date: "${trimmed}"` };
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const maxDaysInMonth = new Date(year, month, 0).getDate();
  return day <= maxDaysInMonth;
}

function formatDateISO(year: number, month: number, day: number): string {
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  return `${year}-${mStr}-${dStr}`;
}

/**
 * Reads binary ArrayBuffer / Base64 / CSV string and parses with XLSX SheetJS
 */
export function parseExcelOrCSV(data: string | ArrayBuffer): ParsedImportRow[] {
  let csvText = '';
  if (typeof data === 'string') {
    csvText = data;
  } else {
    try {
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      csvText = XLSX.utils.sheet_to_csv(worksheet);
    } catch (err) {
      csvText = new TextDecoder().decode(data);
    }
  }
  return parseCSVText(csvText);
}

/**
 * Parses raw CSV or tab-delimited text into structured import rows with smart category resolution
 */
export function parseCSVText(csvText: string, userMappings?: Record<string, string>): ParsedImportRow[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = splitCSVLines(csvText.trim());
  if (lines.length === 0) return [];

  const firstLineCells = splitCSVLine(lines[0]);
  const hasHeader = isHeaderRow(firstLineCells);

  const startIndex = hasHeader ? 1 : 0;
  const rows: ParsedImportRow[] = [];

  let dateIdx = 0;
  let amountIdx = 1;
  let categoryIdx = 2;
  let descriptionIdx = 3;
  let paymentMethodIdx = 4;

  if (hasHeader) {
    firstLineCells.forEach((col, idx) => {
      const lower = col.toLowerCase().trim();
      if (lower.includes('date')) dateIdx = idx;
      else if (lower.includes('amount') || lower.includes('cost') || lower.includes('spent') || lower.includes('price')) amountIdx = idx;
      else if (lower.includes('category')) categoryIdx = idx;
      else if (lower.includes('desc') || lower.includes('note') || lower.includes('memo') || lower.includes('item') || lower.includes('detail')) descriptionIdx = idx;
      else if (lower.includes('payment') || lower.includes('method') || lower.includes('mode') || lower.includes('account') || lower.includes('paid')) paymentMethodIdx = idx;
    });
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = splitCSVLine(line);
    const rawDate = cells[dateIdx] || '';
    const rawAmount = cells[amountIdx] || '';
    const rawCategory = cells[categoryIdx] || '';
    const rawDescription = cells[descriptionIdx] || '';
    const rawPaymentMethod = cells[paymentMethodIdx] || '';

    const dateResult = parseDateString(rawDate);
    const amountResult = parseAmount(rawAmount);

    const description = rawDescription.trim() || rawCategory.trim() || 'Expense';
    const paymentMethodName = rawPaymentMethod.trim();

    // SMART CATEGORY RESOLUTION: Priority Engine
    const categoryRes = resolveSmartCategory(rawCategory, description, userMappings);

    const errors: string[] = [];
    if (dateResult.error) errors.push(dateResult.error);
    if (amountResult.error) errors.push(amountResult.error);

    rows.push({
      rowNumber: i + 1,
      rawDate,
      rawAmount,
      rawCategory,
      rawPaymentMethod,
      rawDescription,
      date: dateResult.date,
      amount: amountResult.amount,
      categoryName: categoryRes.categoryName,
      isCategoryExplicit: categoryRes.source === 'explicit',
      isCategoryConfident: categoryRes.isConfident,
      paymentMethodName,
      description,
      isValid: errors.length === 0,
      errorReason: errors.length > 0 ? errors.join('; ') : null,
    });
  }

  return rows;
}

function isHeaderRow(cells: string[]): boolean {
  const lineText = cells.join(' ').toLowerCase();
  return (
    lineText.includes('date') ||
    lineText.includes('amount') ||
    lineText.includes('category') ||
    lineText.includes('desc')
  );
}

function splitCSVLines(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      cur += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
      if (cur.trim()) result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  if (cur.trim()) result.push(cur);
  return result;
}

function splitCSVLine(line: string): string[] {
  const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  cells.push(cur.trim());
  return cells;
}
