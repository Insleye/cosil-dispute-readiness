"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type DimensionKey =
  | "issuePosition"
  | "evidenceInformation"
  | "exposureStakes"
  | "actionsEscalation"
  | "optionsAwareness"
  | "preparedness";
type Band = "Needs Attention" | "Developing" | "Established";
type Dimension = { key: DimensionKey; label: string };
type Question = {
  id: string;
  dimension: DimensionKey;
  prompt: string;
  options: readonly (readonly [string, 0 | 1 | 2])[];
};

function bandFor(score: number): Band {
  if (score <= 2) return "Needs Attention";
  if (score <= 5) return "Developing";
  return "Established";
}

export function ReadinessAssessment({
  dimensions,
  questions,
  complexityFlags,
}: {
  dimensions: readonly Dimension[];
  questions: readonly Question[];
  complexityFlags: readonly string[];
}) {
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 0 | 1 | 2>>({});
  const [flagIndex, setFlagIndex] = useState(0);
  const [flags, setFlags] = useState<boolean[]>([]);
  const [completed, setCompleted] = useState(false);

  const scores = useMemo(() => {
    const result: Record<DimensionKey, number> = {
      issuePosition: 0,
      evidenceInformation: 0,
      exposureStakes: 0,
      actionsEscalation: 0,
      optionsAwareness: 0,
      preparedness: 0,
    };
    for (const question of questions) {
      result[question.dimension] += answers[question.id] ?? 0;
    }
    return result;
  }, [answers, questions]);

  function answerQuestion(score: 0 | 1 | 2) {
    const question = questions[questionIndex];
    setAnswers((current) => ({ ...current, [question.id]: score }));
    setQuestionIndex((current) => current + 1);
  }

  function answerFlag(value: boolean) {
    setFlags((current) => [...current, value]);
    if (flagIndex === complexityFlags.length - 1) setCompleted(true);
    else setFlagIndex((current) => current + 1);
  }

  function reset() {
    setStarted(false);
    setQuestionIndex(0);
    setAnswers({});
    setFlagIndex(0);
    setFlags([]);
    setCompleted(false);
  }

  if (!started) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div className="rounded-2xl border bg-background p-6 shadow-sm sm:p-10">
          <p className="mb-3 text-sm font-medium text-zinc-500">Cosil Solutions Ltd</p>
          <h1 className="text-3xl font-semibold tracking-tight">Dispute Readiness Guide</h1>
          <p className="mt-4 text-zinc-600">
            A structured guide to help you step back from the immediate dispute, test how clear your current position really is and see the matter through six areas of readiness.
          </p>
          <div className="mt-6 rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-600 dark:bg-zinc-900">
            By the end, you will have a clearer readiness profile showing where your thinking is established and where there may be gaps to consider before your next decision.
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={() => setStarted(true)}>Start assessment</Button>
            <span className="text-sm text-zinc-500">24 questions plus 5 context questions</span>
          </div>
        </div>
      </main>
    );
  }

  if (questionIndex < questions.length) {
    const question = questions[questionIndex];
    const dimension = dimensions.find((item) => item.key === question.dimension)?.label;
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between text-sm text-zinc-500">
          <span>{dimension}</span>
          <span>{questionIndex + 1} of {questions.length}</span>
        </div>
        <div className="mb-8 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div className="h-full bg-foreground transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
        </div>
        <section className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold leading-8">{question.prompt}</h2>
          <div className="mt-6 grid gap-3">
            {question.options.map(([label, score]) => (
              <Button key={label} variant="outline" className="h-auto justify-start whitespace-normal py-4 text-left" onClick={() => answerQuestion(score)}>
                {label}
              </Button>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (!completed) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between text-sm text-zinc-500">
          <span>Context</span>
          <span>{flagIndex + 1} of {complexityFlags.length}</span>
        </div>
        <section className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8">
          <p className="mb-3 text-sm text-zinc-500">These questions provide context only and do not affect your readiness profile.</p>
          <h2 className="text-xl font-semibold leading-8">{complexityFlags[flagIndex]}</h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="outline" className="py-4" onClick={() => answerFlag(true)}>Yes</Button>
            <Button variant="outline" className="py-4" onClick={() => answerFlag(false)}>No</Button>
          </div>
        </section>
      </main>
    );
  }

  const hasComplexity = flags.some(Boolean);
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <div className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-zinc-500">Your result</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Dispute Readiness Profile</h1>
        <p className="mt-3 max-w-2xl text-zinc-600">
          This profile reflects how established your current level of readiness appears across six areas. It does not assess legal merit or recommend what you should do next.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {dimensions.map((dimension) => (
            <div key={dimension.key} className="rounded-xl border p-5">
              <p className="text-sm text-zinc-500">{dimension.label}</p>
              <p className="mt-2 text-xl font-semibold">{bandFor(scores[dimension.key])}</p>
            </div>
          ))}
        </div>

        {hasComplexity ? (
          <div className="mt-6 rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            Your responses also indicate one or more factors that may increase the complexity or significance of this matter.
          </div>
        ) : null}

        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold">What you can do next</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-5">
              <h3 className="font-semibold">Explore Cosil Membership</h3>
              <p className="mt-2 text-sm text-zinc-600">For ongoing community, insight and discussion as your situation develops.</p>
            </div>
            <div className="rounded-xl border p-5">
              <h3 className="font-semibold">Discuss individual support</h3>
              <p className="mt-2 text-sm text-zinc-600">For Cosil to look specifically at your circumstances.</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Button variant="outline" onClick={reset}>Restart assessment</Button>
        </div>
      </div>
    </main>
  );
}
