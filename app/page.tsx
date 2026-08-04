import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TESTS, questionCount } from "@/lib/tests";
import { hasAccess } from "@/lib/pricing";
import Dashboard, { type DashboardTest } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams
}: {
  searchParams: { success?: string; canceled?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Logged-out landing page.
  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-brand">
          Phlebotomy Prep
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          Full-length NHA CPT practice tests. Track your progress, mark each
          answer as <span className="font-semibold">“know it”</span> or{" "}
          <span className="font-semibold">“not sure,”</span> and reveal answers
          as you go or at the end.
        </p>
        <Link
          href={`/test/${TESTS[0].id}`}
          className="mt-8 inline-block rounded-lg bg-brand px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          Try 5 questions free — no sign-up
        </Link>
        <p className="mt-10 text-sm text-slate-500">
          5 practice tests · 550 questions · $2.50 each or $10 for all.
        </p>
      </main>
    );
  }

  // Logged-in: gather purchases + progress.
  const { data: purchaseRows } = await supabase
    .from("purchases")
    .select("test_id")
    .eq("user_id", user.id);
  const purchases = (purchaseRows ?? []).map((r) => r.test_id as string);

  const { data: progressRows } = await supabase
    .from("progress")
    .select("test_id, selected, is_correct")
    .eq("user_id", user.id);

  const items: DashboardTest[] = TESTS.map((t) => {
    const rows = (progressRows ?? []).filter((r) => r.test_id === t.id);
    const answered = rows.filter((r) => r.selected != null).length;
    const correct = rows.filter((r) => r.is_correct === true).length;
    return {
      id: t.id,
      title: t.title,
      subtitle: t.subtitle,
      free: t.free,
      count: questionCount(t),
      access: hasAccess(t.id, t.free, purchases),
      answered,
      correct
    };
  });

  const ownsAll = items.every((i) => i.access);

  const notice = searchParams.success
    ? "Payment received — thank you! If a test still shows locked, refresh in a few seconds."
    : searchParams.canceled
    ? "Checkout canceled. No charge was made."
    : "";

  return (
    <Dashboard
      items={items}
      ownsAll={ownsAll}
      userEmail={user.email ?? ""}
      userName={(user.user_metadata?.name as string) ?? user.email ?? "You"}
      avatar={(user.user_metadata?.avatar_url as string) ?? ""}
      notice={notice}
    />
  );
}
