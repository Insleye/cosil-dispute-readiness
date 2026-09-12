"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Band = "Needs Attention" | "Developing" | "Established";
type DimensionKey =
  | "issuePosition"
  | "evidenceInformation"
  | "exposureStakes"
  | "actionsEscalation"
  | "optionsAwareness"
  | "preparedness";

type Question = {
  id: string;
  dimension: DimensionKey;
  prompt: string;
  options: { label: string; score: 0 | 1 | 2 }[];
};

const DIMENSIONS: { key: DimensionKey; label: string }[] = [
  { key: "issuePosition", label: "Issue & Position" },
  { key: "evidenceInformation", label: "Evidence & Information" },
  { key: "exposureStakes", label: "Exposure & Stakes" },
  { key: "actionsEscalation", label: "Actions & Escalation" },
  { key: "optionsAwareness", label: "Options Awareness" },
  { key: "preparedness", label: "Preparedness" },
];

const QUESTIONS: Question[] = [
  {
    id: "q1_1",
    dimension: "issuePosition",
    prompt: "How clearly could you summarise, in a few sentences, what the dispute is actually about?",
    options: [
      { label: "Not clearly at all", score: 0 },
      { label: "I could give a general idea, but not a precise summary", score: 1 },
      { label: "Very clearly", score: 2 },
    ],
  },
  {
    id: "q1_2",
    dimension: "issuePosition",
    prompt: "Do you understand what the other party's position or view of the situation is, even if you disagree with it?",
    options: [
      { label: "No, I don't know their position", score: 0 },
      { label: "I have some idea, but I'm not fully sure", score: 1 },
      { label: "Yes, I understand their position", score: 2 },
    ],
  },
  {
    id: "q1_3",
    dimension: "issuePosition",
    prompt: "Are you clear on what outcome you are actually seeking from this situation?",
    options: [
      { label: "No, I haven't defined this", score: 0 },
      { label: "I have a rough idea", score: 1 },
      { label: "Yes, this is clear to me", score: 2 },
    ],
  },
  {
    id: "q1_4",
    dimension: "issuePosition",
    prompt: "Do you know which specific points are agreed between you and the other party, and which are genuinely in dispute?",
    options: [
      { label: "No, this isn't clear", score: 0 },
      { label: "Partly, some points are clear and others aren't", score: 1 },
      { label: "Yes, this is clear", score: 2 },
    ],
  },
  {
    id: "q2_1",
    dimension: "evidenceInformation",
    prompt: "Do you have the key documents relevant to this situation, such as contracts, correspondence or notices, in one place?",
    options: [
      { label: "No, they are scattered or missing", score: 0 },
      { label: "Some are gathered, others aren't", score: 1 },
      { label: "Yes, they are gathered together", score: 2 },
    ],
  },
  {
    id: "q2_2",
    dimension: "evidenceInformation",
    prompt: "Could you currently put together a clear timeline of the key events in order?",
    options: [
      { label: "No", score: 0 },
      { label: "I could attempt one, but it would have gaps", score: 1 },
      { label: "Yes", score: 2 },
    ],
  },
  {
    id: "q2_3",
    dimension: "evidenceInformation",
    prompt: "Do you have written records, such as letters, emails or messages, covering the main points of disagreement?",
    options: [
      { label: "No, mostly verbal or undocumented", score: 0 },
      { label: "Some written records exist", score: 1 },
      { label: "Yes, the main points are documented", score: 2 },
    ],
  },
  {
    id: "q2_4",
    dimension: "evidenceInformation",
    prompt: "If someone else needed to understand this situation from your records alone, could they do so?",
    options: [
      { label: "No, they'd need a lot explained to them", score: 0 },
      { label: "They could get a partial picture", score: 1 },
      { label: "Yes, largely", score: 2 },
    ],
  },
  {
    id: "q3_1",
    dimension: "exposureStakes",
    prompt: "Have you identified what could be financially affected if this situation continues or escalates?",
    options: [
      { label: "No", score: 0 },
      { label: "I have a rough sense", score: 1 },
      { label: "Yes, clearly", score: 2 },
    ],
  },
  {
    id: "q3_2",
    dimension: "exposureStakes",
    prompt: "Have you considered how this situation could affect relationships, for example with a neighbour, tenant, business contact, board or colleague?",
    options: [
      { label: "No, I haven't thought about this", score: 0 },
      { label: "I've thought about it briefly", score: 1 },
      { label: "Yes, I've considered this carefully", score: 2 },
    ],
  },
  {
    id: "q3_3",
    dimension: "exposureStakes",
    prompt: "Have you considered any time-related consequences, such as delays, deadlines or ongoing disruption?",
    options: [
      { label: "No", score: 0 },
      { label: "Somewhat", score: 1 },
      { label: "Yes", score: 2 },
    ],
  },
  {
    id: "q3_4",
    dimension: "exposureStakes",
    prompt: "Have you considered any wider consequences beyond the immediate issue, such as reputation, precedent or future decisions this could affect?",
    options: [
      { label: "No", score: 0 },
      { label: "I've thought about this a little", score: 1 },
      { label: "Yes, I've considered this", score: 2 },
    ],
  },
  {
    id: "q4_1",
    dimension: "actionsEscalation",
    prompt: "Are you clear about what actions or communications have already taken place in this dispute?",
    options: [
      { label: "No, not clearly", score: 0 },
      { label: "Partly", score: 1 },
      { label: "Yes, clearly", score: 2 },
    ],
  },
  {
    id: "q4_2",
    dimension: "actionsEscalation",
    prompt: "Have you already sent or received communication that sets out a firm position rather than an open discussion?",
    options: [
      { label: "Yes, and positions feel fixed already", score: 0 },
      { label: "Some firm positions have been stated", score: 1 },
      { label: "No, the situation is still open, or positions remain flexible", score: 2 },
    ],
  },
  {
    id: "q4_3",
    dimension: "actionsEscalation",
    prompt: "Are you aware of any deadlines or time limits that already apply to this situation?",
    options: [
      { label: "No, I haven't checked", score: 0 },
      { label: "I think there might be, but I'm not certain", score: 1 },
      { label: "Yes, I'm aware of any that apply", score: 2 },
    ],
  },
  {
    id: "q4_4",
    dimension: "actionsEscalation",
    prompt: "Could you currently explain, in order, what has happened so far in this dispute?",
    options: [
      { label: "No, not clearly", score: 0 },
      { label: "Roughly, but with gaps", score: 1 },
      { label: "Yes, clearly", score: 2 },
    ],
  },
  {
    id: "q5_1",
    dimension: "optionsAwareness",
    prompt: "Are you aware that disputes like this can generally be handled in more than one way, for example direct negotiation, mediation or a formal process?",
    options: [
      { label: "No", score: 0 },
      { label: "I have a general awareness", score: 1 },
      { label: "Yes", score: 2 },
    ],
  },
  {
    id: "q5_2",
    dimension: "optionsAwareness",
    prompt: "Do you broadly understand the different types of ways a dispute may be managed or progressed?",
    options: [
      { label: "No", score: 0 },
      { label: "I have a general idea", score: 1 },
      { label: "Yes", score: 2 },
    ],
  },
  {
    id: "q5_3",
    dimension: "optionsAwareness",
    prompt: "Are you aware that different options may have different implications for cost, time and relationships?",
    options: [
      { label: "No", score: 0 },
      { label: "I have some awareness", score: 1 },
      { label: "Yes", score: 2 },
    ],
  },
  {
    id: "q5_4",
    dimension: "optionsAwareness",
    prompt: "Do you know, broadly, where you could go to get further guidance on the options available to you?",
    options: [
      { label: "No", score: 0 },
      { label: "I have some idea", score: 1 },
      { label: "Yes", score: 2 },
    ],
  },
  {
    id: "q6_1",
    dimension: "preparedness",
    prompt: "If you needed to explain this situation to someone else today, such as an adviser, colleague or board, how ready would you feel?",
    options: [
      { label: "Not ready at all", score: 0 },
      { label: "Somewhat ready", score: 1 },
      { label: "Well prepared", score: 2 },
    ],
  },
  {
    id: "q6_2",
    dimension: "preparedness",
    prompt: "Do you feel you currently have what you need to decide your next step?",
    options: [
      { label: "No", score: 0 },
      { label: "Partly", score: 1 },
      { label: "Yes", score: 2 },
    ],
  },
  {
    id: "q6_3",
    dimension: "preparedness",
    prompt: "Are there important aspects of the situation that are still unclear to you?",
    options: [
      { label: "Yes, several", score: 0 },
      { label: "Yes, some", score: 1 },
      { label: "No, the main points are clear to me", score: 2 },
    ],
  },
  {
    id: "q6_4",
    dimension: "preparedness",
    prompt: "Overall, how in control of this situation do you currently feel?",
    options: [
      { label: "Not very in control", score: 0 },
      { label: "Somewhat in control", score: 1 },
      { label: "In control", score: 2 },
    ],
  },
];

const COMPLEXITY_FLAGS = [
  "Have formal proceedings or a formal process already begun?",
  "Is there a known deadline or time-sensitive requirement?",
  "Could the financial, property, or business consequences be significant?",
  "Are multiple parties or organisations involved?",
  "Are professional advisers already involved?",
];

function bandFor(score: number): Band {
  if (score <= 2) return "Needs Attention";
  if (score <= 5) return "Developing";
  return "Established";
}

export function NewChatPage() {
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

    for (const question of QUESTIONS) {
      result[question.dimension] += answers[question.id] ?? 0;
    }

    return result;
  }, [answers]);

  const answerQuestion = (score: 0 | 1 | 2) => {
    const question = QUESTIONS[questionIndex];
    setAnswers((current) => ({ ...current, [question.id]: score }));
    if (questionIndex === QUESTIONS.length - 1) {
      setQuestionIndex(QUESTIONS.length);
    } else {
      setQuestionIndex((current) => current + 1);
    }
  };

  const answerFlag = (value: boolean) => {
    setFlags((current) => [...current, value]);
    if (flagIndex === COMPLEXITY_FLAGS.length - 1) {
      setCompleted(true);
    } else {
      setFlagIndex((current) => current + 1);
    }
  };

  const reset = () => {
    setStarted(false);
    setQuestionIndex(0);
    setAnswers({});
    setFlagIndex(0);
    setFlags([]);
    setCompleted(false);
  };

  if (!started) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div className="rounded-2xl border bg-background p-6 shadow-sm sm:p-10">
          <p className="mb-3 text-sm font-medium text-zinc-500">Cosil Solutions Ltd</p>
          <h1 className="text-3xl font-semibold tracking-tight">Enhanced Dispute Readiness Check</h1>
          <p className="mt-4 text-zinc-600">
            A structured self-assessment to help you understand how prepared you are to deal with a dispute.
          </p>
          <div className="mt-6 rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-600 dark:bg-zinc-900">
            This check is diagnostic and reflective only. It does not assess legal merit, recommend a route or provide legal advice.
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={() => setStarted(true)}>Start assessment</Button>
            <span className="text-sm text-zinc-500">24 questions plus 5 context questions</span>
          </div>
          <p className="mt-6 text-xs text-zinc-400">
            Payment gating will be connected before launch. This branch is a development preview only.
          </p>
        </div>
      </main>
    );
  }

  if (questionIndex < QUESTIONS.length) {
    const question = QUESTIONS[questionIndex];
    const dimension = DIMENSIONS.find((item) => item.key === question.dimension)?.label;

    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between text-sm text-zinc-500">
          <span>{dimension}</span>
          <span>{questionIndex + 1} of {QUESTIONS.length}</span>
        </div>
        <div className="mb-8 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-foreground transition-all"
            style={{ width: `${((questionIndex + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <section className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold leading-8">{question.prompt}</h2>
          <div className="mt-6 grid gap-3">
            {question.options.map((option) => (
              <Button
                key={option.label}
                variant="outline"
                className="h-auto justify-start whitespace-normal py-4 text-left"
                onClick={() => answerQuestion(option.score)}
              >
                {option.label}
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
          <span>{flagIndex + 1} of {COMPLEXITY_FLAGS.length}</span>
        </div>
        <section className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8">
          <p className="mb-3 text-sm text-zinc-500">These questions provide context only and do not affect your readiness profile.</p>
          <h2 className="text-xl font-semibold leading-8">{COMPLEXITY_FLAGS[flagIndex]}</h2>
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
          {DIMENSIONS.map((dimension) => (
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

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="outline" onClick={reset}>Restart assessment</Button>
        </div>
      </div>
    </main>
  );
}
