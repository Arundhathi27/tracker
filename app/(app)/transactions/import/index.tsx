import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Platform
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  Download, FileSpreadsheet, AlertTriangle, Upload, RefreshCw, FileUp
} from 'lucide-react-native';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { parseCSVText, parseExcelOrCSV, ParsedImportRow } from '@/utils/importParser';
import { matchCategoryName } from '@/utils/categoryMatcher';
import { checkIsDuplicate } from '@/utils/duplicateDetector';
import { expenseImportService, ImportResultSummary } from '@/services/expenseImportService';
import { categoryMappingService } from '@/services/categoryMappingService';
import { useExpenseImport } from '@/hooks/useExpenseImport';
import { ExpenseImportPreview } from '@/components/import/ExpenseImportPreview';
import { Transaction } from '@/types';

const CSV_TEMPLATE_CONTENT = `Date, Amount, Category, Description, Payment Method
05/01/2026, 500, Vegetables, Vegetables, Cash
08/01/2026, 1200, Groceries, Monthly groceries, UPI
10/01/2026, 15000, Rent, January rent, Bank Transfer`;

export default function BulkExpenseImportScreen() {
  const [csvInput, setCsvInput] = useState('');
  const [step, setStep] = useState<'input' | 'preview' | 'importing' | 'complete'>('input');
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Category Matching & Duplicate State
  const [userCategoryNames, setUserCategoryNames] = useState<string[]>([]);
  const [categoryMappings, setCategoryMappings] = useState<Record<string, string>>({});
  const [savedUserMappings, setSavedUserMappings] = useState<Record<string, string>>({});
  const [existingUserTxs, setExistingUserTxs] = useState<Transaction[]>([]);
  const [skipDuplicatesMap, setSkipDuplicatesMap] = useState<Record<number, boolean>>({});
  const [importResult, setImportResult] = useState<ImportResultSummary | null>(null);

  const { mutateAsync: runExpenseImport } = useExpenseImport();

  useEffect(() => {
    expenseImportService.getAllUserCategoryNames().then(cats => {
      setUserCategoryNames(cats);
    });
    expenseImportService.getExistingUserTransactions().then(txs => {
      setExistingUserTxs(txs || []);
    });
    categoryMappingService.getUserMappings().then(mappings => {
      setSavedUserMappings(mappings || {});
    });
  }, []);

  const handlePickDocument = async () => {
    setErrorMsg(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/comma-separated-values',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFileName(asset.name);

        const file = new File(asset.uri);
        let rows: ParsedImportRow[] = [];

        if (asset.name.toLowerCase().endsWith('.xlsx') || asset.name.toLowerCase().endsWith('.xls')) {
          const buffer = await file.arrayBuffer();
          rows = parseExcelOrCSV(buffer);
        } else {
          const text = await file.text();
          rows = parseCSVText(text, savedUserMappings);
        }

        if (rows.length === 0) {
          setErrorMsg('No data rows found in selected file.');
          return;
        }
        processRowsAndMatchCategories(rows);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not read selected file.');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const file = new File(Paths.document, 'budgetwise_import_template.csv');
      file.create();
      file.write(CSV_TEMPLATE_CONTENT);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Download Expense Import Template',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Template Loaded', 'Sample CSV template content loaded into text box below.');
        setCsvInput(CSV_TEMPLATE_CONTENT);
      }
    } catch (err: any) {
      Alert.alert('Notice', 'Loaded CSV template directly into text box.');
      setCsvInput(CSV_TEMPLATE_CONTENT);
    }
  };

  const handleParseText = () => {
    setErrorMsg(null);
    if (!csvInput.trim()) {
      setErrorMsg('Please select a file or paste CSV text first.');
      return;
    }
    const rows = parseCSVText(csvInput, savedUserMappings);
    if (rows.length === 0) {
      setErrorMsg('No valid data rows found in input.');
      return;
    }
    setSelectedFileName('Pasted CSV Text');
    processRowsAndMatchCategories(rows);
  };

  const handleLoadSample = () => {
    setCsvInput(CSV_TEMPLATE_CONTENT);
    setSelectedFileName('Sample Data');
    setErrorMsg(null);
  };

  const processRowsAndMatchCategories = (rows: ParsedImportRow[]) => {
    const uniqueRawCats = Array.from(new Set(rows.map(r => r.categoryName.trim())));
    const initialMappings: Record<string, string> = {};

    uniqueRawCats.forEach(rawCat => {
      const matchRes = matchCategoryName(rawCat, userCategoryNames);
      if (matchRes.matchedName) {
        initialMappings[rawCat] = matchRes.matchedName;
      } else {
        initialMappings[rawCat] = rawCat;
      }
    });

    const initialSkipMap: Record<number, boolean> = {};
    rows.forEach(r => {
      if (r.isValid && r.date && r.amount) {
        const dupRes = checkIsDuplicate(
          {
            date: r.date,
            amount: r.amount,
            categoryName: initialMappings[r.categoryName.trim()] || r.categoryName,
            description: r.description,
          },
          existingUserTxs
        );
        if (dupRes.isDuplicate) {
          initialSkipMap[r.rowNumber] = true;
        }
      }
    });

    setSkipDuplicatesMap(initialSkipMap);
    setCategoryMappings(initialMappings);
    setParsedRows(rows);
    setStep('preview');
  };

  const handleCategoryMappingChange = (rawCat: string, targetCat: string) => {
    setCategoryMappings(prev => ({
      ...prev,
      [rawCat]: targetCat,
    }));
  };

  const handleToggleSkipDuplicate = (rowNumber: number) => {
    setSkipDuplicatesMap(prev => ({
      ...prev,
      [rowNumber]: !prev[rowNumber],
    }));
  };

  const handleConfirmImport = async () => {
    const validRowsToImport = parsedRows.filter(r => {
      if (!r.isValid) return false;
      if (skipDuplicatesMap[r.rowNumber]) return false;
      return true;
    });

    const skippedDuplicatesCount = Object.values(skipDuplicatesMap).filter(Boolean).length;

    if (validRowsToImport.length === 0) {
      Alert.alert('No Expenses to Import', 'All rows are either invalid or skipped as duplicates.');
      return;
    }

    setStep('importing');
    try {
      const itemsToImport = validRowsToImport.map(r => {
        const mappedCatName = categoryMappings[r.categoryName.trim()] || r.categoryName;
        return {
          rowNumber: r.rowNumber,
          date: r.date!,
          amount: r.amount!,
          categoryName: mappedCatName,
          paymentMethodName: r.paymentMethodName,
          description: r.description,
        };
      });

      const summary = await runExpenseImport({ items: itemsToImport, skippedCount: skippedDuplicatesCount });
      setImportResult(summary);
      setStep('preview');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import expenses');
      setStep('preview');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Bulk Expense Import"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step Indicator Header */}
        <View style={styles.stepHeader}>
          <View style={[styles.stepDot, step === 'input' && styles.stepDotActive]}>
            <Text style={styles.stepDotText}>1</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, (step === 'preview' || step === 'importing') && styles.stepDotActive]}>
            <Text style={styles.stepDotText}>2</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, importResult && styles.stepDotActive]}>
            <Text style={styles.stepDotText}>3</Text>
          </View>
        </View>

        {errorMsg && (
          <View style={styles.errorBox}>
            <AlertTriangle size={18} color={Colors.danger.DEFAULT} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* STEP 1: INPUT / FILE SELECTION */}
        {step === 'input' && (
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderGroup}>
              <FileSpreadsheet size={22} color={Colors.primary.DEFAULT} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Select File or Paste Data</Text>
                <Text style={styles.cardSub}>
                  Select a CSV or Excel (.xlsx) file, or paste table data. Category is optional and can be auto-resolved from descriptions.
                </Text>
              </View>
            </View>

            {/* File Selection Action Card */}
            <TouchableOpacity style={styles.filePickerCard} onPress={handlePickDocument}>
              <FileUp size={28} color={Colors.primary.DEFAULT} />
              <Text style={styles.filePickerTitle}>
                {selectedFileName ? selectedFileName : 'Select CSV or Excel File (.xlsx, .csv)'}
              </Text>
              <Text style={styles.filePickerSub}>Files are processed 100% locally on your device</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR PASTE TEXT</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Template Explanation Box */}
            <View style={styles.templateBox}>
              <Text style={styles.templateTitle}>Required Columns & Format (Category is optional):</Text>
              <Text style={styles.templateCols}>Date | Amount | [Category] | Description | Payment Method</Text>
              
              <View style={styles.exampleBlock}>
                <Text style={styles.exampleHeader}>Example Rows:</Text>
                <Text style={styles.exampleText}>31/01/2026, 160, , Papaya, Not Specified</Text>
                <Text style={styles.exampleText}>31/01/2026, 20, , Auto, Not Specified</Text>
                <Text style={styles.exampleText}>31/01/2026, 160, Groceries, Papaya, Not Specified</Text>
              </View>

              <View style={styles.templateActionRow}>
                <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadTemplate}>
                  <Download size={14} color={Colors.primary.DEFAULT} />
                  <Text style={styles.downloadBtnText}>Download Template (.CSV)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.sampleBtn} onPress={handleLoadSample}>
                  <RefreshCw size={14} color={Colors.text.secondary} />
                  <Text style={styles.sampleBtnText}>Load Sample Data</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={styles.csvInput}
              multiline
              numberOfLines={8}
              placeholder="Paste your CSV text or Excel data here..."
              placeholderTextColor={Colors.text.tertiary}
              value={csvInput}
              onChangeText={setCsvInput}
              textAlignVertical="top"
            />

            <View style={{ marginTop: 16 }}>
              <Button
                label="Preview & Validate Import"
                onPress={handleParseText}
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<Upload size={18} color={Colors.white} />}
              />
            </View>
          </View>
        )}

        {/* STEP 2 / 3: PREVIEW & RESULT COMPONENT */}
        {step === 'preview' && (
          <ExpenseImportPreview
            parsedRows={parsedRows}
            userCategoryNames={userCategoryNames}
            categoryMappings={categoryMappings}
            onCategoryMappingChange={handleCategoryMappingChange}
            existingUserTxs={existingUserTxs}
            skipDuplicatesMap={skipDuplicatesMap}
            onToggleSkipDuplicate={handleToggleSkipDuplicate}
            onConfirmImport={handleConfirmImport}
            onBack={() => {
              setImportResult(null);
              setStep('input');
            }}
            importResult={importResult}
            onDone={() => router.replace('/(app)/transactions' as any)}
          />
        )}

        {/* STEP 2.5: IMPORTING SPINNER */}
        {step === 'importing' && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
            <Text style={styles.loadingTitle}>Importing Expenses...</Text>
            <Text style={styles.loadingSub}>
              Creating transactions & updating monthly spending reports...
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.DEFAULT,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60,
    gap: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border.DEFAULT,
    marginHorizontal: 8,
    maxWidth: 40,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${Colors.danger.DEFAULT}15`,
    padding: 12,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: `${Colors.danger.DEFAULT}30`,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.danger.DEFAULT,
  },
  sectionCard: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 20,
    gap: 16,
    ...Theme.shadows.sm,
  },
  cardHeaderGroup: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  cardSub: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  filePickerCard: {
    borderWidth: 2,
    borderColor: `${Colors.primary.DEFAULT}40`,
    borderStyle: 'dashed',
    borderRadius: Theme.radius.xl,
    backgroundColor: `${Colors.primary.DEFAULT}08`,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  filePickerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
    textAlign: 'center',
  },
  filePickerSub: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.DEFAULT,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.tertiary,
  },
  templateBox: {
    backgroundColor: Colors.background.DEFAULT,
    borderRadius: Theme.radius.lg,
    padding: 12,
    gap: 4,
  },
  templateTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  templateCols: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
    marginVertical: 2,
  },
  exampleBlock: {
    backgroundColor: Colors.surface.DEFAULT,
    padding: 8,
    borderRadius: Theme.radius.sm,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  exampleHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  exampleText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.text.primary,
  },
  templateActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${Colors.primary.DEFAULT}15`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.radius.md,
  },
  downloadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  sampleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sampleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  csvInput: {
    backgroundColor: Colors.background.DEFAULT,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 12,
    fontSize: 13,
    color: Colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    minHeight: 120,
  },
  loadingCard: {
    backgroundColor: Colors.surface.DEFAULT,
    borderRadius: Theme.radius.xl,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  loadingSub: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
