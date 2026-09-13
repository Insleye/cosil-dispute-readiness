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
type DimensionIntroduction = { heading: string; body: string };
type Interpretation = { text: string; reflection: string };
type Interpretations = Record<DimensionKey, Record<Band, Interpretation>>;
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
  dimensionIntroductions,
  questions,
  complexityFlags,
  interpretations,
}: {
  dimensions: readonly Dimension[];
  dimensionIntroductions: Record<DimensionKey, DimensionIntroduction>;
  questions: readonly Question[];
  complexityFlags: readonly string[];
  interpretations: Interpretations;
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
    const intro = dimensionIntroductions[question.dimension];
    const isDimensionStart = questionIndex === 0 || questions[questionIndex - 1].dimension !== question.dimension;
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between text-sm text-zinc-500">
          <span>{dimension}</span>
          <span>{questionIndex + 1} of {questions.length}</span>
        </div>
        <div className="mb-8 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div className="h-full bg-foreground transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
        </div>
        {isDimensionStart ? (
          <section className="mb-5 rounded-2xl border bg-zinc-50 p-5 dark:bg-zinc-900 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">The Cosil lens</p>
            <h2 className="mt-2 text-xl font-semibold">{intro.heading}</h2>
            <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-300">{intro.body}</p>
          </section>
        ) : null}
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
  const perspectives = [
    { title: "Property and major works", body: "A substantial charge may be the visible dispute, while the wider picture can involve what was understood about the works, the information available, consultation, subsequent communications, the history between the parties and the consequences of allowing the matter to progress.", point: "The amount being challenged may be the most visible part of the dispute without necessarily being the only part that matters." },
    { title: "Governance and board disputes", body: "A disagreement about a decision may also involve how it was reached, differing understandings of authority, previous conduct, relationships between decision-makers, communications with members and the effect of deteriorating confidence.", point: "A disagreement about one decision can sometimes expose a wider governance problem." },
    { title: "Commercial and payment disputes", body: "An unpaid amount may be the obvious issue, while the wider dispute can involve what was agreed, what each party says occurred, contemporaneous information, when concerns arose, the continuing commercial relationship and proportionality.", point: "A clear financial demand does not necessarily mean the wider dispute is equally straightforward." },
    { title: "Relationship and mediation context", body: "Entrenched positions may develop through different understandings of events, unsuccessful communication, perceived unfairness, previous decisions or concerns that have never been directly addressed.", point: "Understanding why a position has hardened can be different from agreeing with it." },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <article id="readiness-brief" className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8 print:border-0 print:shadow-none">
        <p className="text-sm font-medium text-zinc-500">Cosil Solutions Ltd</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your Dispute Readiness Brief</h1>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-600">You have examined your dispute across six areas that can influence how clearly a matter is understood and how prepared you are to make considered decisions. Read the profile as a whole. A dispute can be well understood in one area while important uncertainty remains elsewhere.</p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Your Readiness Profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">{dimensions.map((dimension) => <div key={dimension.key} className="rounded-xl border p-5"><p className="text-sm text-zinc-500">{dimension.label}</p><p className="mt-2 text-xl font-semibold">{bandFor(scores[dimension.key])}</p></div>)}</div>
          <p className="mt-4 text-sm leading-6 text-zinc-600"><strong>There is no overall readiness score.</strong> A gap in one area can matter even where the wider position appears well developed, so the profile preserves those differences rather than reducing them to a single number.</p>
        </section>

        <section className="mt-10 border-t pt-8">
          <h2 className="text-xl font-semibold">What your responses bring into focus</h2>
          <div className="mt-5 space-y-6">{dimensions.map((dimension) => { const band=bandFor(scores[dimension.key]); const item=interpretations[dimension.key][band]; return <div key={dimension.key} className="rounded-xl border p-5"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold">{dimension.label}</h3><span className="text-sm font-medium text-zinc-500">{band}</span></div><p className="mt-3 leading-7 text-zinc-600">{item.text}</p><div className="mt-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900"><p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">A question worth considering</p><p className="mt-2 font-medium leading-7">{item.reflection}</p></div></div>; })}</div>
        </section>

        <section className="mt-10 border-t pt-8">
          <h2 className="text-xl font-semibold">Before drawing conclusions from your profile</h2>
          <p className="mt-3 leading-7 text-zinc-600">A developed readiness profile does not establish that your position is correct. Equally, areas requiring attention do not mean that your underlying position is weak. One useful test of a position is not simply whether you can explain why you believe it, but whether you can identify what could reasonably cause you to reconsider it.</p>
          <p className="mt-4 font-medium">Having completed the Guide, is there anything about the dispute you now view differently from when you began?</p>
        </section>

        {hasComplexity ? <section className="mt-10 rounded-xl border bg-zinc-50 p-5 dark:bg-zinc-900"><h2 className="text-lg font-semibold">Wider context</h2><p className="mt-3">Your responses also indicate one or more factors that may increase the complexity or significance of this matter.</p><p className="mt-3 text-sm leading-6 text-zinc-600">Complexity is separate from readiness. A person may understand a dispute well while the matter itself still involves significant consequences, multiple parties, formal processes, professional involvement or time-sensitive considerations.</p></section> : null}

        <section className="mt-10 border-t pt-8">
          <h2 className="text-xl font-semibold">Disputes in practice</h2>
          <p className="mt-3 text-zinc-600">The issue that brings a dispute into focus is not always the only issue influencing how it develops. These examples illustrate why experienced dispute examination looks beyond the presenting disagreement.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">{perspectives.map((item) => <div key={item.title} className="rounded-xl border p-5"><h3 className="font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-zinc-600">{item.body}</p><p className="mt-3 text-sm leading-6"><strong>Professional perspective:</strong> {item.point}</p></div>)}</div>
        </section>

        <section className="mt-10 border-t pt-8">
          <h2 className="text-xl font-semibold">Understanding your Brief</h2>
          <p className="mt-3 leading-7 text-zinc-600">Your Dispute Readiness Brief reflects the pattern of your responses and provides a structured professional interpretation of readiness. It is designed to help you examine the dispute more critically. It does not assess legal merits, determine liability, establish the strength of a case or prescribe a particular course of action.</p>
          <p className="mt-3 leading-7 text-zinc-600">What it can do is bring into focus the questions, uncertainties and wider considerations that may deserve greater attention before important decisions are made.</p>
        </section>

        <section className="mt-10 border-t pt-8">
          <h2 className="text-xl font-semibold">When general insight reaches its limit</h2>
          <p className="mt-3 leading-7 text-zinc-600">Your Brief can identify where your responses bring particular considerations into focus. What it cannot determine is what those factors mean in the circumstances of your particular dispute, how competing considerations should be weighed, or the significance that should be attached to them.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 print:hidden">
            <div className="rounded-xl border p-5"><h3 className="font-semibold">Dispute Strategy Consultation</h3><p className="mt-2 text-sm text-zinc-600">Where a matter requires individual consideration, Cosil can examine the circumstances more closely. Consultations are from £395.</p><Button asChild className="mt-4"><a href="https://cosilsolutions.co.uk/" target="_blank" rel="noreferrer">Explore further support</a></Button></div>
            <div className="rounded-xl border p-5"><h3 className="font-semibold">Stay connected</h3><p className="mt-2 text-sm text-zinc-600">Not looking for individual support right now? Join Cosil Dispute Watch or the Membership waitlist.</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild variant="outline"><a href="https://whatsapp.com/channel/0029VbDYUmFJf05lwkozbZ01" target="_blank" rel="noreferrer">Dispute Watch</a></Button><Button asChild><a href="/membership-waitlist">Membership waitlist</a></Button></div></div>
          </div>
        </section>

        <section className="mt-10 border-t pt-8 print:hidden">
          <h2 className="text-xl font-semibold">Keep your Dispute Readiness Brief</h2>
          <p className="mt-2 text-sm text-zinc-600">Save a copy so you can revisit your profile and reflection points as the matter develops.</p>
          <div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => window.print()}>Download / save Brief as PDF</Button><Button variant="outline" onClick={reset}>Restart Guide</Button></div>
        </section>

        <section className="mt-10 border-t pt-8 print:hidden">
          <h2 className="text-xl font-semibold">One final question</h2>
          <p className="mt-3 font-medium">Did the Guide change how you are thinking about your dispute?</p>
          <div className="mt-3 flex flex-wrap gap-2"><Button variant="outline">Yes, significantly</Button><Button variant="outline">Yes, to some extent</Button><Button variant="outline">Not particularly</Button></div>
          <p className="mt-4 text-xs text-zinc-500">This feedback is optional. No response is stored unless a feedback submission service is connected.</p>
        </section>
      </article>
    </main>
  );
}
