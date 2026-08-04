import testsData from "@/data/tests.json";

export type AnswerLetter = "A" | "B" | "C" | "D";

export interface Question {
  n: number;
  stem: string;
  options: string[];
  answer: AnswerLetter;
}

export interface Section {
  name: string;
  questions: Question[];
}

export interface Test {
  id: string;
  title: string;
  subtitle: string;
  free: boolean;
  sections: Section[];
}

export const TESTS = testsData as unknown as Test[];

export function getTest(id: string): Test | undefined {
  return TESTS.find((t) => t.id === id);
}

export function questionCount(t: Test): number {
  return t.sections.reduce((sum, s) => sum + s.questions.length, 0);
}

// Flatten a test's questions in display order (used by the quiz runner).
export function flatQuestions(t: Test): Question[] {
  return t.sections.flatMap((s) => s.questions);
}

// Truncate a test's sections to the first `limit` questions in display
// order, preserving section grouping (used for the signed-out preview).
export function limitSections(sections: Section[], limit: number): Section[] {
  let remaining = limit;
  const result: Section[] = [];
  for (const s of sections) {
    if (remaining <= 0) break;
    const questions = s.questions.slice(0, remaining);
    if (questions.length > 0) result.push({ ...s, questions });
    remaining -= questions.length;
  }
  return result;
}
