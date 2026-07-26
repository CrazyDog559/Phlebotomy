import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTest, flatQuestions } from "@/lib/tests";
import { hasAccess } from "@/lib/pricing";
import Quiz, { type InitialProgress } from "@/components/Quiz";

export const dynamic = "force-dynamic";

export default async function TestPage({
  params
}: {
  params: { testId: string };
}) {
  const test = getTest(params.testId);
  if (!test) notFound();

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/test/${params.testId}`);

  const { data: purchaseRows } = await supabase
    .from("purchases")
    .select("test_id")
    .eq("user_id", user.id);
  const purchases = (purchaseRows ?? []).map((r) => r.test_id as string);

  if (!hasAccess(test.id, test.free, purchases)) {
    // Not purchased — send back to dashboard where they can buy it.
    redirect("/");
  }

  const { data: progressRows } = await supabase
    .from("progress")
    .select("question_n, selected, confidence, is_correct")
    .eq("user_id", user.id)
    .eq("test_id", test.id);

  const initial: InitialProgress = {};
  for (const r of progressRows ?? []) {
    initial[r.question_n as number] = {
      selected: (r.selected as string) ?? undefined,
      confidence: (r.confidence as "know" | "unsure") ?? undefined,
      is_correct: (r.is_correct as boolean) ?? undefined
    };
  }

  return (
    <Quiz
      testId={test.id}
      title={test.title}
      subtitle={test.subtitle}
      userId={user.id}
      sections={test.sections}
      total={flatQuestions(test).length}
      initial={initial}
    />
  );
}
