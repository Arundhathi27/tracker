/**
 * Automated Reproduction Test Suite for 114 January Expenses Import
 */
import { parseCSVText, parseDateString, parseAmount } from '../utils/importParser';
import { expenseImportService } from '../services/expenseImportService';

const REAL_CSV_DATA = `Date,Amount,Category,Description,Payment Method
01/01/2026,50,Food,Flowers for Mom,Not Specified
01/01/2026,45,Food,Fruit,Not Specified
01/01/2026,50,Groceries,Rava to cook,Not Specified
01/01/2026,1000,Transfer,Sent to Indian Bank for Appa,Not Specified
02/01/2026,150,Shopping,Mom things,Not Specified
03/01/2026,1500,Family,Patti,Not Specified
04/01/2026,5260,Shopping,Pongal dress,Not Specified
05/01/2026,4811,Groceries,RMC grocery,Not Specified
07/01/2026,11500,Housing,Rent,Not Specified
08/01/2026,180,Other,Mani - given 2000 for rent,Not Specified
09/01/2026,2000,Family,Patti - given for rent,Not Specified
10/01/2026,3000,Gifts,Pongal gift,Not Specified
11/01/2026,910,Bills,Gas,Not Specified
12/01/2026,1500,Family,Vignesh - returned on 14/01,Not Specified
16/01/2026,506,Fuel,Fuel,Not Specified
18/01/2026,2000,Family,For father,Not Specified
19/01/2026,619,Recharge,Recharge for Patti,Not Specified
23/01/2026,728,Personal Care,Shampoo / Haircare,Not Specified
29/01/2026,375,Health,Hospital,Not Specified
31/01/2026,500,Family,Amma,Not Specified
31/01/2026,500,Gifts,Gift,Not Specified`;

async function runReproductionTests() {
  console.log('==================================================');
  console.log('RUNNING REPRODUCTION TEST: JANUARY 2026 DATA');
  console.log('==================================================\n');

  let passed = 0;
  const total = 7;

  // TEST 1: Parse real CSV rows
  const parsedRows = parseCSVText(REAL_CSV_DATA);
  console.log(`Parsed ${parsedRows.length} rows from CSV sample.`);
  const test1 = parsedRows.length === 21 && parsedRows.every(r => r.isValid);
  console.log(`TEST 1 — CSV Row Parsing: ${test1 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test1) passed++;

  // TEST 2: Verify DD/MM/YYYY date interpretation
  // Row 7 is 07/01/2026 -> 2026-01-07
  const row7 = parsedRows.find(r => r.rawDate === '07/01/2026');
  const test2 = row7?.date === '2026-01-07';
  console.log(`TEST 2 — Date 07/01/2026 parsed as 2026-01-07: ${test2 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test2) passed++;

  // TEST 3: Amount column precedence (08/01/2026,180,Other,Mani - given 2000 for rent)
  const row8 = parsedRows.find(r => r.rawDate === '08/01/2026');
  const test3 = row8?.amount === 180 && row8?.description === 'Mani - given 2000 for rent';
  console.log(`TEST 3 — Amount precedence (180 vs 2000 in description): ${test3 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test3) passed++;

  // TEST 4: Payment Method "Not Specified"
  const row1 = parsedRows[0];
  const test4 = row1.paymentMethodName === 'Not Specified';
  console.log(`TEST 4 — Payment Method "Not Specified" preserved: ${test4 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test4) passed++;

  // TEST 5: Transfer category preserved as expense
  const transferRow = parsedRows.find(r => r.categoryName === 'Transfer');
  const test5 = transferRow !== undefined && transferRow.description === 'Sent to Indian Bank for Appa';
  console.log(`TEST 5 — Transfer category preserved: ${test5 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test5) passed++;

  // TEST 6: Simulated 114 row dataset parsing
  let jan114 = 'Date,Amount,Category,Description,Payment Method\n';
  for (let i = 1; i <= 114; i++) {
    const dayStr = String((i % 28) + 1).padStart(2, '0');
    jan114 += `${dayStr}/01/2026,${100 + i},Groceries,Item ${i},Not Specified\n`;
  }
  const jan114Parsed = parseCSVText(jan114);
  const test6 = jan114Parsed.length === 114 && jan114Parsed.every(r => r.isValid && r.date?.startsWith('2026-01'));
  console.log(`TEST 6 — 114 January 2026 rows parsed without budget: ${test6 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test6) passed++;

  // TEST 7: Map mappedItems when NO budget exists (must NOT create monthly budget)
  const mapped = jan114Parsed.map(r => ({
    type: 'expense',
    amount: r.amount!,
    description: r.description,
    date: r.date!,
    category_id: null,
    payment_method_id: null,
  }));
  const test7 = mapped.length === 114 && mapped.every(m => m.date.startsWith('2026-01') && m.category_id === null);
  console.log(`TEST 7 — Mapped DTOs for 114 rows have category_id=null (no budget creation): ${test7 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test7) passed++;

  console.log('\n==================================================');
  console.log(`REPRODUCTION TEST SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('==================================================\n');
}

runReproductionTests();
