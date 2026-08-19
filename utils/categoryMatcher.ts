/**
 * Category Matching & Fuzzy Suggestion Utility for BudgetWise Bulk Import
 */

export interface CategoryMatchResult {
  rawName: string;
  matchedName: string | null;
  confidence: 'exact' | 'suggested' | 'none';
  availableCategories: string[];
}

/**
 * Calculates Levenshtein edit distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Matches an imported raw category name against existing category names.
 * Priority:
 * 1. Exact match (case-insensitive)
 * 2. Prefix / substring match (e.g. "Veg" → "Vegetables")
 * 3. Levenshtein edit distance match (e.g. "Vegitables" → "Vegetables")
 */
export function matchCategoryName(
  rawCategory: string,
  existingCategoryNames: string[]
): CategoryMatchResult {
  const trimmedRaw = rawCategory.trim();
  const lowerRaw = trimmedRaw.toLowerCase();

  if (existingCategoryNames.length === 0) {
    return {
      rawName: trimmedRaw,
      matchedName: null,
      confidence: 'none',
      availableCategories: [],
    };
  }

  // 1. Exact match
  const exact = existingCategoryNames.find(c => c.toLowerCase().trim() === lowerRaw);
  if (exact) {
    return {
      rawName: trimmedRaw,
      matchedName: exact,
      confidence: 'exact',
      availableCategories: existingCategoryNames,
    };
  }

  // 2. Substring or Prefix match
  const prefixMatch = existingCategoryNames.find(c => {
    const lowerC = c.toLowerCase().trim();
    return lowerC.startsWith(lowerRaw) || lowerRaw.startsWith(lowerC);
  });
  if (prefixMatch) {
    return {
      rawName: trimmedRaw,
      matchedName: prefixMatch,
      confidence: 'suggested',
      availableCategories: existingCategoryNames,
    };
  }

  // 3. Levenshtein fuzzy match
  let bestCandidate: string | null = null;
  let minDistance = Infinity;

  existingCategoryNames.forEach(c => {
    const lowerC = c.toLowerCase().trim();
    const dist = levenshteinDistance(lowerRaw, lowerC);
    const maxLen = Math.max(lowerRaw.length, lowerC.length);
    const similarityRatio = 1 - dist / maxLen;

    if (similarityRatio >= 0.6 && dist < minDistance) {
      minDistance = dist;
      bestCandidate = c;
    }
  });

  if (bestCandidate) {
    return {
      rawName: trimmedRaw,
      matchedName: bestCandidate,
      confidence: 'suggested',
      availableCategories: existingCategoryNames,
    };
  }

  // No safe match found
  return {
    rawName: trimmedRaw,
    matchedName: null,
    confidence: 'none',
    availableCategories: existingCategoryNames,
  };
}
