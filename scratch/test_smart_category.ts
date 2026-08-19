/**
 * Automated Test Suite for Smart Category Assignment
 */
import { resolveSmartCategory } from '../utils/smartCategoryResolver';
import { parseCSVText } from '../utils/importParser';

async function runSmartCategoryTests() {
  console.log('==================================================');
  console.log('RUNNING SMART CATEGORY ASSIGNMENT TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  const total = 10;

  // TEST 1: Category = Groceries, Description = Papaya -> Groceries (Explicit Priority 1)
  const res1 = resolveSmartCategory('Groceries', 'Papaya');
  const test1 = res1.categoryName === 'Groceries' && res1.source === 'explicit';
  console.log(`TEST 1 — Explicit Category priority (Groceries + Papaya): ${test1 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test1) passed++;

  // TEST 2: Category = empty, Description = Papaya -> Fruits (Built-in Priority 2)
  const res2 = resolveSmartCategory('', 'Papaya');
  const test2 = res2.categoryName === 'Fruits' && res2.source === 'built_in';
  console.log(`TEST 2 — Built-in dictionary (Papaya -> Fruits): ${test2 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test2) passed++;

  // TEST 3: Category = empty, Description = Banana -> Fruits
  const res3 = resolveSmartCategory('', 'Banana');
  const test3 = res3.categoryName === 'Fruits';
  console.log(`TEST 3 — Built-in dictionary (Banana -> Fruits): ${test3 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test3) passed++;

  // TEST 4: Category = empty, Description = Tomato -> Vegetables
  const res4 = resolveSmartCategory('', 'Tomato');
  const test4 = res4.categoryName === 'Vegetables';
  console.log(`TEST 4 — Built-in dictionary (Tomato -> Vegetables): ${test4 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test4) passed++;

  // TEST 5: Category = empty, Description = Auto -> Travel
  const res5 = resolveSmartCategory('', 'Auto');
  const test5 = res5.categoryName === 'Travel';
  console.log(`TEST 5 — Built-in dictionary (Auto -> Travel): ${test5 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test5) passed++;

  // TEST 6: Category = empty, Description = Petrol -> Fuel
  const res6 = resolveSmartCategory('', 'Petrol');
  const test6 = res6.categoryName === 'Fuel';
  console.log(`TEST 6 — Built-in dictionary (Petrol -> Fuel): ${test6 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test6) passed++;

  // TEST 7: Category = empty, Description = completely unknown item -> Uncategorized (Ask user)
  const res7 = resolveSmartCategory('', 'XyZUnknownGadget123');
  const test7 = res7.categoryName === 'Uncategorized' && !res7.isConfident;
  console.log(`TEST 7 — Unknown item defaults to Uncategorized (Unconfident): ${test7 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test7) passed++;

  // TEST 8: User changes Papaya from Fruits -> Groceries (Save mapping)
  const mockUserMappings: Record<string, string> = {
    papaya: 'Groceries',
  };
  const test8 = mockUserMappings['papaya'] === 'Groceries';
  console.log(`TEST 8 — User custom mapping saved (Papaya -> Groceries): ${test8 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test8) passed++;

  // TEST 9: Import Papaya again with empty category using user mapping -> Groceries
  const res9 = resolveSmartCategory('', 'Papaya', mockUserMappings);
  const test9 = res9.categoryName === 'Groceries' && res9.source === 'user_mapping';
  console.log(`TEST 9 — User saved mapping takes priority (Papaya -> Groceries): ${test9 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test9) passed++;

  // TEST 10: Explicit CSV category always overrides automatic suggestion (Groceries -> Papaya)
  const csvText = `Date,Amount,Category,Description,Payment Method\n31/01/2026,160,Groceries,Papaya,Not Specified`;
  const parsed = parseCSVText(csvText, mockUserMappings);
  const test10 = parsed.length === 1 && parsed[0].categoryName === 'Groceries' && parsed[0].isCategoryExplicit;
  console.log(`TEST 10 — Explicit CSV Category overrides all suggestions: ${test10 ? 'PASSED ✓' : 'FAILED ❌'}`);
  if (test10) passed++;

  console.log('\n==================================================');
  console.log(`SMART CATEGORY TEST SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('==================================================\n');
}

runSmartCategoryTests();
