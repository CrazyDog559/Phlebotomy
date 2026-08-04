// Central pricing + access rules. Amounts are in US cents.
export const PER_TEST_CENTS = 250; // $2.50 per additional test
export const BUNDLE_CENTS = 1000; // $10.00 for all tests
export const BUNDLE_ID = "all";

// Buyers can slide the price up above the base to support development.
// The base price is still the floor — sliders never go below these.
export const PER_TEST_MAX_CENTS = 2500; // up to $25 on a single test
export const BUNDLE_MAX_CENTS = 5000; // up to $50 on the bundle

// A separate, no-unlock "Support" tab for a plain one-time donation.
export const SUPPORT_ID = "support";
export const SUPPORT_MIN_CENTS = 300; // $3
export const SUPPORT_MAX_CENTS = 10000; // $100
export const SUPPORT_DEFAULT_CENTS = 500; // $5
export const SUPPORT_PRESET_CENTS = [300, 500, 1000, 2500];

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
