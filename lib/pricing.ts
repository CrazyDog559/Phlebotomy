// Central pricing + access rules. Amounts are in US cents.
export const PER_TEST_CENTS = 250; // $2.50 per additional test
export const BUNDLE_CENTS = 1000; // $10.00 for all tests
export const BUNDLE_ID = "all";

// A user has access to a test if it is free, OR they bought that test, OR they bought the bundle.
export function hasAccess(
  testId: string,
  isFree: boolean,
  purchases: string[]
): boolean {
  if (isFree) return true;
  if (purchases.includes(BUNDLE_ID)) return true;
  return purchases.includes(testId);
}

export function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
