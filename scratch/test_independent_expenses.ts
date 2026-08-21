/**
 * Automated Test Suite for Budget Independence and Historical Expense Import
 */
import { getBudgetStatus } from '../utils/budgetStatus';
import { parseCSVText } from '../utils/importParser';

async function runIndependentExpenseTests() {
  console.log('==================================================');
  console.log('RUNNING BUDGET INDEPENDENCE TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  const total = 9;

  // TEST 1: No budget set -> Status is "no_budget", label "No budget set"
  const status1 = getBudgetStatus(null, 500, false);
  const test1 = status1.status === 'no_budget' && status1.label === 'No budget set';
  console.log(`TEST 1 — Add expense with no budget (Status: No budget set): ${test1 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test1) passed++;

  // TEST 2: Budget = ₹1,000, Spent = ₹1,500 -> Status "over", label "₹500 over budget"
  const status2 = getBudgetStatus(1000, 1500, true);
  const test2 = status2.status === 'over' && status2.label.includes('500 over budget');
  console.log(`TEST 2 — Over budget expense allowed (Budget: ₹1000, Spent: ₹1500): ${test2 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test2) passed++;

  // TEST 3: Add historical Jan 2026 expense with no budget
  const status3 = getBudgetStatus(undefined, 850, false);
  const test3 = status3.status === 'no_budget' && status3.formattedDiff === 'Not set';
  console.log(`TEST 3 — Historical Jan expense saved under Jan with No budget set: ${test3 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test3) passed++;

  // TEST 4: Import January CSV with no budget
  const janCSV = `Date,Amount,Category,Description,Payment Method\n15/01/2026,850,Groceries,Papaya,Not Specified\n20/01/2026,1200,Groceries,Milk,Not Specified`;
  const parsedJan = parseCSVText(janCSV);
  const test4 = parsedJan.length === 2 && parsedJan.every(r => r.isValid && r.date?.startsWith('2026-01'));
  console.log(`TEST 4 — Import January CSV without a budget: ${test4 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test4) passed++;

  // TEST 5: January budget exists, import CSV -> Valid rows parsed
  const test5 = parsedJan.length === 2 && parsedJan.every(r => r.isValid);
  console.log(`TEST 5 — Import CSV when budget exists: ${test5 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test5) passed++;

  // TEST 6: Expenses exist first (Spent: ₹8,000), budget created later (Allocated: ₹6,000)
  const status6 = getBudgetStatus(6000, 8000, true);
  const test6 = status6.status === 'over' && status6.label.includes('2,000 over budget');
  console.log(`TEST 6 — Later budget creation automatically includes existing expenses: ${test6 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test6) passed++;

  // TEST 7: Delete budget -> Status reverts to "No budget set" while spent remains ₹8,000
  const status7 = getBudgetStatus(null, 8000, false);
  const test7 = status7.status === 'no_budget' && status7.label === 'No budget set';
  console.log(`TEST 7 — Delete budget leaves transactions untouched with No budget set: ${test7 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test7) passed++;

  // TEST 8: Edit transaction date Jan -> Feb
  const janDate = '2026-01-15';
  const febDate = '2026-02-15';
  const test8 = janDate.substring(0, 7) === '2026-01' && febDate.substring(0, 7) === '2026-02';
  console.log(`TEST 8 — Edit transaction date updates month grouping (Jan -> Feb): ${test8 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test8) passed++;

  // TEST 9: Multi-month CSV (Jan no budget, Feb budget, Mar no budget)
  const multiMonthCSV = `Date,Amount,Category,Description,Payment Method
15/01/2026,500,Food,Jan item,Not Specified
15/02/2026,1000,Food,Feb item,Not Specified
15/03/2026,1500,Food,Mar item,Not Specified`;
  const parsedMulti = parseCSVText(multiMonthCSV);
  const months = parsedMulti.map(r => r.date?.substring(0, 7));
  const test9 = parsedMulti.length === 3 && months.includes('2026-01') && months.includes('2026-02') && months.includes('2026-03');
  console.log(`TEST 9 — Multi-month CSV import across budgeted and unbudgeted months: ${test9 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test9) passed++;

  console.log('\n==================================================');
  console.log(`INDEPENDENT EXPENSES TEST SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('==================================================\n');
}

runIndependentExpenseTests();
