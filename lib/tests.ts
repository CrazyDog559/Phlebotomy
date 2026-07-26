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
