/**
 * Smart Category Resolution Engine for BudgetWise
 */

export const BUILT_IN_CATEGORY_DICTIONARY: Record<string, string> = {
  // Fruits
  papaya: 'Fruits',
  banana: 'Fruits',
  apple: 'Fruits',
  mango: 'Fruits',
  orange: 'Fruits',
  grapes: 'Fruits',
  watermelon: 'Fruits',
  fruit: 'Fruits',
  fruits: 'Fruits',

  // Vegetables
  tomato: 'Vegetables',
  potato: 'Vegetables',
  onion: 'Vegetables',
  veggies: 'Vegetables',
  vegetables: 'Vegetables',
  veg: 'Vegetables',

  // Groceries
  milk: 'Groceries',
  rice: 'Groceries',
  rava: 'Groceries',
  wheat: 'Groceries',
  groceries: 'Groceries',
  grocery: 'Groceries',
  'rmc grocery': 'Groceries',

  // Travel / Transport
  auto: 'Travel',
  bus: 'Travel',
  train: 'Travel',
  flight: 'Travel',
  cab: 'Travel',
  uber: 'Travel',
  ola: 'Travel',

  // Fuel
  petrol: 'Fuel',
  diesel: 'Fuel',
  fuel: 'Fuel',

  // Personal Care
  shampoo: 'Personal Care',
  haircare: 'Personal Care',
  soap: 'Personal Care',

  // Health
  hospital: 'Health',
  medicine: 'Health',
  doctor: 'Health',
  pharmacy: 'Health',

  // Housing
  rent: 'Housing',
  housing: 'Housing',

  // Bills
  gas: 'Bills',
  electricity: 'Bills',
  water: 'Bills',

  // Recharge
  recharge: 'Recharge',

  // Family
  patti: 'Family',
  amma: 'Family',
  appa: 'Family',
  father: 'Family',
  mother: 'Family',

  // Gifts
  gift: 'Gifts',
  gifts: 'Gifts',
  'pongal gift': 'Gifts',

  // Shopping
  'pongal dress': 'Shopping',
  dress: 'Shopping',
  clothes: 'Shopping',
  shopping: 'Shopping',

  // Transfer
  transfer: 'Transfer',
};

export interface ResolvedCategoryResult {
  categoryName: string;
  source: 'explicit' | 'user_mapping' | 'built_in' | 'uncategorized';
  isConfident: boolean;
}

/**
 * Smartly resolves category for a given transaction input.
 * 
 * PRIORITY 1 — Explicit Category:
 * If user/CSV provides a non-empty category, use it cleanly. NEVER override an explicit category.
 * 
 * PRIORITY 2 — User-Created Custom Mappings:
 * Check if the user previously mapped this description/keyword.
 * 
 * PRIORITY 3 — Built-in Description Dictionary:
 * Matches description keywords (e.g. Papaya -> Fruits, Auto -> Travel).
 * 
 * PRIORITY 4 / 5 — Uncategorized / Suggestion:
 * Default to Uncategorized only when unresolvable.
 */
export function resolveSmartCategory(
  rawCategory?: string | null,
  rawDescription?: string | null,
  userMappings?: Record<string, string>
): ResolvedCategoryResult {
  // PRIORITY 1 — Explicit Category
  if (rawCategory && rawCategory.trim()) {
    return {
      categoryName: rawCategory.trim(),
      source: 'explicit',
      isConfident: true,
    };
  }

  const descTrimmed = (rawDescription || '').trim();
  const descLower = descTrimmed.toLowerCase();

  if (!descLower) {
    return {
      categoryName: 'Uncategorized',
      source: 'uncategorized',
      isConfident: false,
    };
  }

  // PRIORITY 2 — User-Created Mappings
  if (userMappings) {
    // Exact match
    if (userMappings[descLower]) {
      return {
        categoryName: userMappings[descLower],
        source: 'user_mapping',
        isConfident: true,
      };
    }

    // Keyword match within description
    for (const kw of Object.keys(userMappings)) {
      if (descLower.includes(kw)) {
        return {
          categoryName: userMappings[kw],
          source: 'user_mapping',
          isConfident: true,
        };
      }
    }
  }

  // PRIORITY 3 — Built-in Dictionary
  // Exact match
  if (BUILT_IN_CATEGORY_DICTIONARY[descLower]) {
    return {
      categoryName: BUILT_IN_CATEGORY_DICTIONARY[descLower],
      source: 'built_in',
      isConfident: true,
    };
  }

  // Word token match
  const tokens = descLower.split(/[^a-z0-9]+/);
  for (const token of tokens) {
    if (token && BUILT_IN_CATEGORY_DICTIONARY[token]) {
      return {
        categoryName: BUILT_IN_CATEGORY_DICTIONARY[token],
        source: 'built_in',
        isConfident: true,
      };
    }
  }

  // Keyword contains match
  for (const kw of Object.keys(BUILT_IN_CATEGORY_DICTIONARY)) {
    if (descLower.includes(kw)) {
      return {
        categoryName: BUILT_IN_CATEGORY_DICTIONARY[kw],
        source: 'built_in',
        isConfident: true,
      };
    }
  }

  // PRIORITY 5 — Default Uncategorized
  return {
    categoryName: 'Uncategorized',
    source: 'uncategorized',
    isConfident: false,
  };
}
