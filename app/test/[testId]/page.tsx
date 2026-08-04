import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTest, flatQuestions, limitSections, TESTS } from "@/lib/tests";
import { hasAccess } from "@/lib/pricing";
import Quiz, { type InitialProgress } from "@/components/Quiz";

export const dynamic = "force-dynamic";

// Signed-out visitors can try this many questions of the first test before
// being asked to sign in.
const PREVIEW_QUESTION_LIMIT = 5;

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

  if (!user) {
    if (test.id !== TESTS[0].id || !test.free) {
      redirect(`/login?next=/test/${params.testId}`);
    }
    return (
      <Quiz
        testId={test.id}
        title={test.title}
        subtitle={test.subtitle}
        userId={null}
        sections={limitSections(test.sections, PREVIEW_QUESTION_LIMIT)}
        total={flatQuestions(test).length}
        initial={{}}
      />
    );
  }

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
