import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { SUPPORT_ID } from "@/lib/pricing";

export const runtime = "nodejs";

// Service-role client bypasses RLS so we can record a verified purchase.
function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const testId = session.metadata?.test_id;

    if (userId && testId && session.payment_status === "paid") {
      const supabase = admin();

      // Support donations don't unlock anything and a user can make several,
      // so they get their own table keyed by session id instead of the
      // purchases table's one-row-per-(user, test) shape.
      const { error } =
        testId === SUPPORT_ID
          ? await supabase.from("donations").upsert(
              {
                user_id: userId,
                amount_cents: session.amount_total,
                stripe_session_id: session.id
              },
              { onConflict: "stripe_session_id" }
            )
          : await supabase.from("purchases").upsert(
              {
                user_id: userId,
                test_id: testId,
                amount_cents: session.amount_total,
                stripe_session_id: session.id
              },
              { onConflict: "user_id,test_id" }
            );
      if (error) {
        // Return 500 so Stripe retries delivery.
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
