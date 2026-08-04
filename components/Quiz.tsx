"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Section } from "@/lib/tests";

type Confidence = "know" | "unsure";
interface Ans {
  selected?: string;
  confidence?: Confidence;
  is_correct?: boolean;
}
export type InitialProgress = Record<number, Ans>;

const LETTERS = ["A", "B", "C", "D"];

export default function Quiz({
  testId,
  title,
  subtitle,
  userId,
  sections,
  total,
  initial
}: {
  testId: string;
  title: string;
  subtitle: string;
  userId: string | null;
  sections: Section[];
  total: number;
  initial: InitialProgress;
}) {
  const flat = useMemo(
    () =>
      sections.flatMap((s) =>
        s.questions.map((q) => ({ ...q, section: s.name }))
      ),
    [sections]
  );

  const [answers, setAnswers] = useState<InitialProgress>(initial);
  const [idx, setIdx] = useState(0);
  const [revealMode, setRevealMode] = useState<"immediate" | "end">("immediate");
  const [finished, setFinished] = useState(false);
  const supabase = createClient();

  const q = flat[idx];
  const a = answers[q.n] ?? {};
  const revealed =
    finished || (revealMode === "immediate" && a.selected != null);

  async function persist(n: number, patch: Ans) {
    const next = { ...(answers[n] ?? {}), ...patch };
    setAnswers((prev) => ({ ...prev, [n]: next }));
    if (!userId) return; // Guest preview — nothing to save yet.
    await supabase.from("progress").upsert(
      {
        user_id: userId,
        test_id: testId,
        question_n: n,
        selected: next.selected ?? null,
        confidence: next.confidence ?? null,
        is_correct: next.is_correct ?? null
      },
      { onConflict: "user_id,test_id,question_n" }
    );
  }

  function choose(letter: string) {
    if (finished) return;
    persist(q.n, { selected: letter, is_correct: letter === q.answer });
  }

  function toggleConfidence(c: Confidence) {
    const nextC = a.confidence === c ? undefined : c;
    persist(q.n, { confidence: nextC });
  }

  const answeredCount = flat.filter((f) => answers[f.n]?.selected != null).length;
  const correctCount = flat.filter((f) => answers[f.n]?.is_correct === true).length;

  async function restart() {
    if (!confirm("Clear your answers for this test and start over?")) return;
    if (userId) {
      await supabase
        .from("progress")
        .delete()
        .eq("user_id", userId)
        .eq("test_id", testId);
    }
    setAnswers({});
    setIdx(0);
    setFinished(false);
  }

  // ---------- Results view ----------
  if (finished) {
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const unsureWrong = flat.filter(
      (f) =>
        answers[f.n]?.confidence === "unsure" &&
        answers[f.n]?.is_correct === false
    ).length;
    const knowWrong = flat.filter(
      (f) =>
        answers[f.n]?.confidence === "know" &&
        answers[f.n]?.is_correct === false
    ).length;

    return (
      <div className="min-h-screen">
        <TopBar title={title} />
        <main className="mx-auto max-w-3xl px-6 py-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-400">
              Your score
            </p>
            <p className="mt-1 text-5xl font-extrabold text-brand">{pct}%</p>
            <p className="mt-2 text-slate-600">
              {correctCount} of {total} correct
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                {knowWrong} marked “know it” but wrong
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {unsureWrong} “not sure” and wrong
              </span>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setFinished(false)}
                className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
              >
                Review answers
              </button>
              <button
                onClick={restart}
                className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Restart
              </button>
              <Link
                href="/"
                className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-50"
              >
                All tests
              </Link>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {flat.map((f, i) => {
              const ans = answers[f.n] ?? {};
              const correctIdx = LETTERS.indexOf(f.answer);
              const chosenIdx = ans.selected ? LETTERS.indexOf(ans.selected) : -1;
              const ok = ans.is_correct === true;
              return (
                <div
                  key={f.n}
                  className={`rounded-xl border p-4 ${
                    ans.selected == null
                      ? "border-slate-200 bg-white"
                      : ok
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <button
                    onClick={() => {
                      setFinished(false);
                      setIdx(i);
                    }}
                    className="text-left"
                  >
                    <p className="font-semibold text-slate-800">
                      {f.n}. {f.stem}
                    </p>
                  </button>
                  <p className="mt-2 text-sm">
                    <span className="text-slate-500">Correct: </span>
                    <span className="font-medium text-emerald-700">
                      {f.answer}. {f.options[correctIdx]}
                    </span>
                  </p>
                  {ans.selected && !ok && (
                    <p className="text-sm">
                      <span className="text-slate-500">You chose: </span>
                      <span className="font-medium text-red-700">
                        {ans.selected}. {f.options[chosenIdx]}
                      </span>
                    </p>
                  )}
                  {ans.confidence && (
                    <span
                      className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        ans.confidence === "know"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {ans.confidence === "know" ? "Marked: know it" : "Marked: not sure"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // ---------- Quiz runner ----------
  function navClass(n: number, i: number) {
    const ans = answers[n] ?? {};
    const showResult =
      finished || (revealMode === "immediate" && ans.selected != null);
    let base =
      "h-8 w-8 rounded text-xs font-semibold flex items-center justify-center ";
    if (i === idx) base += "ring-2 ring-brand ring-offset-1 ";
    if (ans.selected == null) return base + "bg-slate-100 text-slate-400";
    if (showResult)
      return (
        base +
        (ans.is_correct ? "bg-emerald-500 text-white" : "bg-red-500 text-white")
      );
    return base + "bg-brand text-white";
  }

  return (
    <div className="min-h-screen pb-24">
      <TopBar title={title}>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs">
          <button
            onClick={() => setRevealMode("immediate")}
            className={`rounded px-2 py-1 font-medium ${
              revealMode === "immediate"
                ? "bg-brand text-white"
                : "text-slate-500"
            }`}
          >
            Reveal as I go
          </button>
          <button
            onClick={() => setRevealMode("end")}
            className={`rounded px-2 py-1 font-medium ${
              revealMode === "end" ? "bg-brand text-white" : "text-slate-500"
            }`}
          >
            Reveal at end
          </button>
        </div>
      </TopBar>

      <main className="mx-auto max-w-3xl px-6 py-6">
        {!userId && (
          <div className="mb-4 rounded-lg border border-brand/30 bg-brand-light px-4 py-3 text-sm text-brand-dark">
            Free preview — questions 1–{flat.length} of {total}.{" "}
            <Link
              href={`/login?next=/test/${testId}`}
              className="font-semibold underline"
            >
              Sign in
            </Link>{" "}
            to unlock the rest.
          </div>
        )}
        <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
          <span>{subtitle}</span>
          <span>
            {answeredCount}/{total} answered
            {revealMode === "immediate" && ` · ${correctCount} correct`}
          </span>
        </div>

        {/* Question navigator */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {flat.map((f, i) => (
            <button key={f.n} onClick={() => setIdx(i)} className={navClass(f.n, i)}>
              {f.n}
            </button>
          ))}
        </div>

        {/* Current question */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            {q.section}
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-800">
            {q.n}. {q.stem}
          </p>

          <div className="mt-4 space-y-2">
            {q.options.map((opt, i) => {
              const letter = LETTERS[i];
              const isChosen = a.selected === letter;
              const isCorrect = q.answer === letter;
              let cls =
                "w-full text-left rounded-lg border px-4 py-3 transition ";
              if (revealed && isCorrect)
                cls += "border-emerald-400 bg-emerald-50 text-emerald-900";
              else if (revealed && isChosen && !isCorrect)
                cls += "border-red-400 bg-red-50 text-red-900";
              else if (isChosen)
                cls += "border-brand bg-brand-light text-brand";
              else cls += "border-slate-200 hover:border-slate-300 hover:bg-slate-50";
              return (
                <button key={letter} className={cls} onClick={() => choose(letter)}>
                  <span className="mr-2 font-bold text-brand">{letter}.</span>
                  {opt}
                  {revealed && isCorrect && (
                    <span className="ml-2 font-semibold text-emerald-600">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Confidence marking */}
          <div className="mt-5 flex items-center gap-2">
            <span className="text-sm text-slate-500">Mark:</span>
            <button
              onClick={() => toggleConfidence("know")}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                a.confidence === "know"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              ✓ Know it
            </button>
            <button
              onClick={() => toggleConfidence("unsure")}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                a.confidence === "unsure"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              ? Not sure
            </button>
          </div>

          {revealed && (
            <p className="mt-4 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600">
              Correct answer: <span className="font-semibold">{q.answer}</span>.{" "}
              {q.options[LETTERS.indexOf(q.answer)]}
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            ← Previous
          </button>
          {idx < flat.length - 1 ? (
            <button
              onClick={() => setIdx((i) => Math.min(flat.length - 1, i + 1))}
              className="rounded-lg bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark"
            >
              Next →
            </button>
          ) : userId ? (
            <button
              onClick={() => setFinished(true)}
              className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700"
            >
              Finish &amp; see results
            </button>
          ) : (
            <Link
              href={`/login?next=/test/${testId}`}
              className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700"
            >
              Sign in to continue →
            </Link>
          )}
        </div>

        <div className="mt-4 text-center">
          {userId ? (
            <button
              onClick={() => setFinished(true)}
              className="text-sm font-medium text-brand hover:underline"
            >
              Finish now &amp; see results
            </button>
          ) : (
            <Link
              href={`/login?next=/test/${testId}`}
              className="text-sm font-medium text-brand hover:underline"
            >
              Sign in to unlock the rest of this test →
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

function TopBar({
  title,
  children
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← All tests
          </Link>
          <span className="hidden font-semibold text-slate-800 sm:inline">
            {title}
          </span>
        </div>
        {children}
      </div>
    </header>
  );
}
