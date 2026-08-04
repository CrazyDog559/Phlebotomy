import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getTest } from "@/lib/tests";
import {
  PER_TEST_CENTS,
  PER_TEST_MAX_CENTS,
  BUNDLE_CENTS,
  BUNDLE_MAX_CENTS,
  BUNDLE_ID,
  SUPPORT_ID,
  SUPPORT_MIN_CENTS,
  SUPPORT_MAX_CENTS,
  hasAccess
} from "@/lib/pricing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let testId: string;
  let amountInput: number | undefined;
  try {
    ({ testId, amount: amountInput } = await request.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // A plain "buy me a coffee" donation — no test to unlock, just a charge.
  if (testId === SUPPORT_ID) {
    const amount = Math.round(Number(amountInput));
    if (
      !Number.isFinite(amount) ||
      amount < SUPPORT_MIN_CENTS ||
      amount > SUPPORT_MAX_CENTS
    ) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: { name: "Support Phlebotomy Prep development" }
          },
          quantity: 1
        }
      ],
      metadata: { user_id: user.id, test_id: SUPPORT_ID },
      success_url: `${site}/?success=1`,
      cancel_url: `${site}/?canceled=1`
    });
    return NextResponse.json({ url: session.url });
  }

  // Resolve product + base/floor + ceiling for the "pay what you'd like" slider.
  let base: number;
  let max: number;
  let name: string;
  if (testId === BUNDLE_ID) {
    base = BUNDLE_CENTS;
    max = BUNDLE_MAX_CENTS;
    name = "All 5 Phlebotomy Practice Tests";
  } else {
    const test = getTest(testId);
    if (!test || test.free) {
      return NextResponse.json({ error: "Invalid test" }, { status: 400 });
    }
    base = PER_TEST_CENTS;
    max = PER_TEST_MAX_CENTS;
    name = test.title;
  }

  // The buyer may choose to pay more than the base price to support
  // development, but never less, and never above the slider's ceiling.
  const amount =
    amountInput != null && Number.isFinite(amountInput)
      ? Math.min(Math.max(Math.round(amountInput), base), max)
      : base;

  // Prevent paying for something already owned.
  const { data: purchaseRows } = await supabase
    .from("purchases")
    .select("test_id")
    .eq("user_id", user.id);
  const purchases = (purchaseRows ?? []).map((r) => r.test_id as string);
  if (purchases.includes(BUNDLE_ID)) {
    return NextResponse.json({ error: "You already own everything." }, { status: 400 });
  }
  if (testId !== BUNDLE_ID && hasAccess(testId, false, purchases)) {
    return NextResponse.json({ error: "You already own this test." }, { status: 400 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amount,
          product_data: { name }
        },
        quantity: 1
      }
    ],
    metadata: { user_id: user.id, test_id: testId },
    success_url: `${site}/?success=1`,
    cancel_url: `${site}/?canceled=1`
  });

  return NextResponse.json({ url: session.url });
}
