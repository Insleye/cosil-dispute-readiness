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
type Question = {
  id: string;
  dimension: DimensionKey;
  prompt: string;
  options: readonly (readonly [string, 0 | 1 | 2])[];
};

type Insight = { title: string; body: string };
type Analysis = {
  profileSummary: string;
  strengths: Insight[];
  priorities: Insight[];
  connections: string[];
  complexityText: string | null;
  complexityFactors: string[];
  nextSteps: string[];
  reflections: string[];
  contextInsight: string | null;
  supportText: string;
};

const dimensionGuidance: Record<
  DimensionKey,
  { strength: string; priority: string; next: string; reflection: string }
> = {
  issuePosition: {
    strength:
      "You appear able to separate the central dispute from the wider history and distinguish important areas of agreement, disagreement and uncertainty. That makes later decisions easier to test against the actual issues rather than the accumulated narrative.",
    priority:
      "The central issue, the other party's position or the outcome you are seeking is not yet fully separated from the wider history. Until those elements are clearer, activity can increase without necessarily moving the dispute forward.",
    next:
      "Write a one-page issue map separating: the central issue, what is agreed, what is disputed, what remains uncertain, and the outcome you are trying to achieve.",
    reflection:
      "Could someone with no prior knowledge identify the real dispute, the principal difference between the parties, and the outcome you are seeking from a one-page summary?",
  },
  evidenceInformation: {
    strength:
      "Your records appear capable of telling a reasonably coherent story without depending heavily on recollection. You also appear able to distinguish what the records establish from what remains interpretation or uncertainty.",
    priority:
      "The evidential picture may still depend on explanation, recollection or material that has not been organised around the disputed points. Having documents is useful, but the stronger question is what each document actually establishes and what remains missing.",
    next:
      "Create a short chronology and an evidence map. For each disputed point, identify the document or record that supports it, any material gap, and anything that currently rests on recollection or assumption.",
    reflection:
      "For each important disputed point, can you identify what supports it, what contradicts it, and what is still missing?",
  },
  exposureStakes: {
    strength:
      "You appear to be looking beyond the headline issue and considering wider financial, relationship, timing, governance or reputational consequences. That supports more proportionate decision-making.",
    priority:
      "Your attention may still be concentrated on the immediate issue rather than the wider consequences of continuation, delay or escalation. Those secondary effects can become as important as the original disagreement.",
    next:
      "List the wider consequences of the dispute continuing for another three to six months, including money, time, disruption, relationships, governance, reputation and future dealings where relevant.",
    reflection:
      "If the dispute continues, what could change beyond the immediate amount or complaint, and which of those consequences would matter most?",
  },
  actionsEscalation: {
    strength:
      "You appear to understand the dispute as a sequence, including the actions that changed its tone, increased formality or affected the scope for resolution. That can help distinguish purposeful next steps from reactive ones.",
    priority:
      "The current stage, important turning points or time-sensitive requirements may not yet be fully clear. This matters because the significance of a next step often depends on what has already happened and what stage the dispute has reached.",
    next:
      "Mark the main turning points on your chronology: attempts to resolve, changes in position, formal steps, deadlines, and communications that materially altered the dispute.",
    reflection:
      "What has genuinely changed the dispute so far, and is the next proposed step resolving an issue or simply increasing formality?",
  },
  optionsAwareness: {
    strength:
      "You appear to recognise that there may be more than one route forward and that different routes carry different consequences for cost, time, control, relationships and reversibility.",
    priority:
      "The dispute may currently feel as though it has one obvious route. A single-route view can narrow decision-making before proportionality, reversibility and alternatives have been properly compared.",
    next:
      "Set out at least three realistic paths, including maintaining the present course, a resolution-focused route, and a more formal route where relevant. Compare cost, time, control, reversibility and likely relationship impact.",
    reflection:
      "Which route gives you the best balance of outcome, cost, time and control, and which step would be hardest to reverse once taken?",
  },
  preparedness: {
    strength:
      "You appear able to step back from the latest development, distinguish established information from uncertainty and identify the factors that need to be weighed before a decision is made.",
    priority:
      "The latest development or immediate pressure may still be driving the way the dispute is being viewed. A decision-ready position requires enough distance to separate facts, uncertainties, objectives and consequences.",
    next:
      "Prepare a short decision note containing: what is established, what remains uncertain, the decision now required, the factors that matter to that decision, and what information would materially change your view.",
    reflection:
      "If you had to make a decision today, which facts, uncertainties and consequences would genuinely determine it?",
  },
};

const complexityLabels = [
  "formal proceedings or a formal process",
  "a known deadline or time-sensitive requirement",
  "potentially significant financial, property or business consequences",
  "multiple parties or organisations",
  "professional advisers already involved",
] as const;

function bandFor(score: number): Band {
  if (score <= 2) return "Needs Attention";
  if (score <= 5) return "Developing";
  return "Established";
}

function rankDimensions(
  dimensions: readonly Dimension[],
  scores: Record<DimensionKey, number>
) {
  return [...dimensions].sort((a, b) => scores[a.key] - scores[b.key]);
}

function buildAnalysis(
  dimensions: readonly Dimension[],
  scores: Record<DimensionKey, number>,
  answers: Record<string, 0 | 1 | 2>,
  flags: boolean[]
): Analysis {
  const ranked = rankDimensions(dimensions, scores);
  const bands = dimensions.map((dimension) => ({
    ...dimension,
    score: scores[dimension.key],
    band: bandFor(scores[dimension.key]),
  }));
  const established = bands.filter((item) => item.band === "Established");
  const developing = bands.filter((item) => item.band === "Developing");
  const needs = bands.filter((item) => item.band === "Needs Attention");
  const complexityFactors: string[] = flags.flatMap((value, index) =>
    value && complexityLabels[index] ? [complexityLabels[index]] : []
  );

  let profileSummary: string;
  if (established.length >= 5) {
    profileSummary =
      "Your profile is strongly established across most areas. The value now lies less in doing more and more in checking that the few weaker or more complex elements do not distort an otherwise well-prepared position.";
  } else if (needs.length >= 3) {
    profileSummary =
      "Your answers suggest that several foundations are not yet settled. The most useful next move is likely to be organising the dispute before adding further activity, correspondence or escalation.";
  } else if (established.length >= 3 && needs.length === 0) {
    profileSummary =
      "Your profile is broadly well developed, with several established areas and no major readiness gap showing at dimension level. The remaining value lies in tightening the developing areas and testing how they interact.";
  } else {
    profileSummary =
      "Your profile is mixed. Some parts of the dispute appear reasonably organised while others are less settled. That matters because a strong area does not always compensate for a weak one when a decision, deadline or escalation point is approaching.";
  }

  const strengths = established
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => ({
      title: item.label,
      body: dimensionGuidance[item.key].strength,
    }));

  if (strengths.length === 0) {
    const strongest = [...bands].sort((a, b) => b.score - a.score).slice(0, 2);
    strongest.forEach((item) =>
      strengths.push({
        title: `A foundation to build on: ${item.label}`,
        body:
          item.band === "Developing"
            ? `This is one of your relatively stronger areas. ${dimensionGuidance[item.key].strength}`
            : "Your answers show some awareness in this area, even though it is not yet consistently established. That gives you a starting point for organising the dispute more deliberately.",
      })
    );
  }

  const priorities = ranked
    .filter((item) => bandFor(scores[item.key]) !== "Established")
    .slice(0, 4)
    .map((item) => ({
      title: item.label,
      body: dimensionGuidance[item.key].priority,
    }));

  const connections: string[] = [];
  const b = (key: DimensionKey) => bandFor(scores[key]);

  if (
    b("evidenceInformation") === "Established" &&
    b("optionsAwareness") !== "Established"
  ) {
    connections.push(
      "Your evidential picture appears stronger than your options analysis. That means you may be relatively clear about what happened while still being less clear about which route is proportionate or what outcome you are prepared to accept."
    );
  }
  if (
    b("issuePosition") === "Established" &&
    b("preparedness") !== "Established"
  ) {
    connections.push(
      "You appear relatively clear about the dispute itself, but less settled on the factors that should drive the next decision. Knowing what the disagreement is and being decision-ready are related, but they are not the same thing."
    );
  }
  if (
    b("actionsEscalation") === "Established" &&
    b("evidenceInformation") !== "Established"
  ) {
    connections.push(
      "You have a relatively clear sense of how the matter has escalated, while the evidential picture is less settled. Further formality can be easier to manage when the key records, gaps and disputed points have first been organised."
    );
  }
  if (
    b("evidenceInformation") === "Established" &&
    b("issuePosition") !== "Established"
  ) {
    connections.push(
      "You appear to have useful information, but the core issue or competing positions are less clearly separated. A large or coherent file has limited strategic value if it is not tied to the precise points that remain in dispute."
    );
  }
  if (
    b("exposureStakes") !== "Established" &&
    b("optionsAwareness") !== "Established"
  ) {
    connections.push(
      "Both the wider stakes and the available routes are still developing. Comparing options before understanding what is actually at stake can lead to a technically available route that is commercially or personally disproportionate."
    );
  }
  if (
    (answers.q4_3 ?? 2) <= 1 &&
    (answers.q2_3 ?? 2) <= 1
  ) {
    connections.push(
      "Your answers indicate some uncertainty around both time-sensitive requirements and gaps in the information. Where those factors coincide, it is useful to identify what needs clarifying first rather than treating every unresolved point as equally urgent."
    );
  }
  if (
    (answers.q1_2 ?? 2) <= 1 &&
    (answers.q5_1 ?? 2) <= 1
  ) {
    connections.push(
      "Your understanding of the other party's position and the available routes both appear incomplete. Before choosing a strategy, it can be useful to test what the other side is actually resisting and whether the disagreement is about facts, expectations, outcome or process."
    );
  }

  if (connections.length === 0) {
    connections.push(
      "Your six results are relatively aligned. That is useful, but the profile should still be read as a set of connected areas rather than six separate scores. A change in evidence, timing, objectives or escalation can alter what matters most."
    );
  }

  const complexityText =
    complexityFactors.length === 0
      ? null
      : established.length >= 4
        ? "Your readiness is relatively strong, but your answers also identify factors that may make the dispute more involved to manage. Prepared does not necessarily mean straightforward. Complexity should therefore be considered separately from the quality of your preparation."
        : "Your answers identify factors that may make the dispute more involved to manage. These do not reduce your readiness score, but they can increase the importance of prioritising information, deadlines, decision points and proportionality.";

  const nextSteps: string[] = [];
  ranked
    .filter((item) => bandFor(scores[item.key]) !== "Established")
    .slice(0, 4)
    .forEach((item) => nextSteps.push(dimensionGuidance[item.key].next));

  if ((answers.q4_3 ?? 2) <= 1) {
    nextSteps.unshift(
      "Confirm any known deadline, formal stage or time-sensitive requirement and record it separately from the general chronology."
    );
  }
  if ((answers.q2_3 ?? 2) <= 1 && !nextSteps.some((x) => x.includes("evidence map"))) {
    nextSteps.push(
      "Identify the three most important information gaps or inconsistencies and decide whether each one genuinely affects the next decision."
    );
  }
  if ((answers.q5_4 ?? 2) <= 1) {
    nextSteps.push(
      "Before taking a harder-to-reverse step, note what it would commit you to in cost, time, formality or relationship impact."
    );
  }

  const dedupedNext = [...new Set(nextSteps)].slice(0, 6);

  const reflections = ranked
    .slice(0, 3)
    .map((item) => dimensionGuidance[item.key].reflection);

  let contextInsight: string | null = null;
  if (
    b("evidenceInformation") !== "Established" &&
    b("actionsEscalation") === "Established"
  ) {
    contextInsight =
      "A dispute can become procedurally advanced before its evidential picture is fully organised. At that point, more correspondence or formality may increase activity without resolving the underlying uncertainty.";
  } else if (
    b("evidenceInformation") === "Established" &&
    b("optionsAwareness") !== "Established"
  ) {
    contextInsight =
      "A well-documented dispute can still be difficult to resolve if the desired outcome, acceptable alternatives and consequences of each route have not been separated clearly.";
  } else if (b("issuePosition") !== "Established") {
    contextInsight =
      "Disputes often become harder to manage when the original issue, later events and reactions to those events merge into one narrative. Separating those layers can reveal that some points need evidence, some need clarification and some may be capable of agreement.";
  } else if (complexityFactors.length > 0) {
    contextInsight =
      "Complexity is not the same as weakness. A well-prepared party may still benefit from additional structure where deadlines, multiple parties, formal processes or significant consequences are present.";
  }

  let supportText: string;
  if (established.length >= 4 && complexityFactors.length <= 1) {
    supportText =
      "Your profile suggests you may be able to continue using the Brief as a structured check on your own decision-making. Further support is optional rather than assumed. Membership may be the more proportionate route if you want ongoing dispute-readiness resources.";
  } else if (needs.length >= 2 || complexityFactors.length >= 3) {
    supportText =
      "There are enough moving parts in your profile that an independent strategic review may add value if you want to test the key issues, evidence, exposure and options before taking a further step. That does not mean formal intervention is necessarily required.";
  } else {
    supportText =
      "Your profile contains both useful foundations and areas that would benefit from further structure. You can use the Brief to work on those areas yourself, or consider a strategy consultation if you want an independent review before deciding what comes next.";
  }

  return {
    profileSummary,
    strengths,
    priorities,
    connections: connections.slice(0, 3),
    complexityText,
    complexityFactors,
    nextSteps: dedupedNext,
    reflections,
    contextInsight,
    supportText,
  };
}

function ascii(text: string) {
  return text
    .replace(/£/g, "GBP ")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, "");
}

function wrapPdfText(text: string, max = 88) {
  const words = ascii(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function escapePdf(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function downloadBriefPdf(
  dimensions: readonly Dimension[],
  scores: Record<DimensionKey, number>,
  analysis: Analysis
) {
  const sections: { text: string; bold?: boolean }[] = [];
  const addHeading = (text: string) => sections.push({ text, bold: true });
  const addBody = (text: string) =>
    wrapPdfText(text).forEach((line) => sections.push({ text: line }));
  const addGap = () => sections.push({ text: "" });

  addHeading("COSIL SOLUTIONS - DISPUTE READINESS BRIEF");
  addBody(`Generated: ${new Date().toLocaleDateString("en-GB")}`);
  addGap();
  addBody(
    "This Brief is a diagnostic and strategic information tool. It does not provide legal advice, assess legal merits or predict the outcome of any dispute."
  );
  addGap();

  addHeading("YOUR READINESS PROFILE");
  dimensions.forEach((dimension) =>
    addBody(`${dimension.label}: ${bandFor(scores[dimension.key])}`)
  );
  addGap();

  addHeading("PROFESSIONAL INTERPRETATION");
  addBody(analysis.profileSummary);
  addGap();

  addHeading("STRONGER AREAS");
  analysis.strengths.forEach((item) => {
    addBody(`${item.title}: ${item.body}`);
    addGap();
  });

  addHeading("WHERE ATTENTION MAY BE USEFUL");
  if (analysis.priorities.length) {
    analysis.priorities.forEach((item) => {
      addBody(`${item.title}: ${item.body}`);
      addGap();
    });
  } else {
    addBody(
      "No dimension-level gap is currently showing. Focus on maintaining clarity and testing any changes in evidence, timing, objectives or complexity."
    );
    addGap();
  }

  addHeading("IMPORTANT CONNECTIONS");
  analysis.connections.forEach((item) => {
    addBody(`- ${item}`);
    addGap();
  });

  if (analysis.complexityText) {
    addHeading("COMPLEXITY IN CONTEXT");
    addBody(analysis.complexityText);
    if (analysis.complexityFactors.length) {
      addBody(`Factors indicated: ${analysis.complexityFactors.join(", ")}.`);
    }
    addGap();
  }

  addHeading("PRIORITISED PRACTICAL CONSIDERATIONS");
  analysis.nextSteps.forEach((item, index) => {
    addBody(`${index + 1}. ${item}`);
    addGap();
  });

  addHeading("BEFORE YOU ESCALATE");
  analysis.reflections.forEach((item) => {
    addBody(`- ${item}`);
    addGap();
  });

  addHeading("FURTHER SUPPORT");
  addBody(analysis.supportText);
  addBody(
    "Cosil Membership: GBP 39/month when launched. Dispute Strategy Consultations: from GBP 395 depending on scope and complexity."
  );
  addBody("Further information: https://cosilsolutions.co.uk/");
  addGap();
  addBody(
    "Cosil Solutions Ltd. Strategic dispute consultancy and mediation support. This Brief is for informational and diagnostic purposes only."
  );

  const linesPerPage = 48;
  const pages: { text: string; bold?: boolean }[][] = [];
  for (let i = 0; i < sections.length; i += linesPerPage) {
    pages.push(sections.slice(i, i + linesPerPage));
  }

  const objects: string[] = [];
  const pageObjectNumbers: number[] = [];
  const catalogObj = 1;
  const pagesObj = 2;
  const fontRegularObj = 3;
  const fontBoldObj = 4;
  let nextObj = 5;

  for (let i = 0; i < pages.length; i++) {
    pageObjectNumbers.push(nextObj);
    nextObj += 2;
  }

  objects[catalogObj] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objects[fontRegularObj] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[fontBoldObj] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  objects[pagesObj] = `<< /Type /Pages /Kids [${pageObjectNumbers
    .map((n) => `${n} 0 R`)
    .join(" ")}] /Count ${pages.length} >>`;

  pages.forEach((pageLines, index) => {
    const pageObj = pageObjectNumbers[index];
    const contentObj = pageObj + 1;
    let stream = "BT\n50 790 Td\n";
    for (const line of pageLines) {
      const font = line.bold ? "/F2 12 Tf" : "/F1 10 Tf";
      stream += `${font}\n(${escapePdf(ascii(line.text))}) Tj\n0 -15 Td\n`;
    }
    stream += "ET";
    objects[contentObj] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[pageObj] =
      `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 595 842] ` +
      `/Resources << /Font << /F1 ${fontRegularObj} 0 R /F2 ${fontBoldObj} 0 R >> >> ` +
      `/Contents ${contentObj} 0 R >>`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Cosil-Dispute-Readiness-Brief-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ReadinessAssessment({
  dimensions,
  dimensionIntroductions,
  questions,
  complexityFlags,
}: {
  dimensions: readonly Dimension[];
  dimensionIntroductions: Record<DimensionKey, DimensionIntroduction>;
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

  const analysis = useMemo(
    () => buildAnalysis(dimensions, scores, answers, flags),
    [dimensions, scores, answers, flags]
  );

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

  function goBack() {
    if (questionIndex > 0 && questionIndex <= questions.length) {
      setQuestionIndex((current) => current - 1);
    }
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
          <p className="mb-3 text-sm font-medium text-zinc-500">
            Cosil Solutions Ltd
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Dispute Readiness Guide
          </h1>
          <p className="mt-4 leading-7 text-zinc-600">
            A structured diagnostic designed to help you step back from the
            immediate dispute, test how clear your current position really is
            and identify what deserves attention before your next decision.
          </p>
          <div className="mt-6 rounded-xl border bg-zinc-50 p-4 text-sm leading-6 text-zinc-600 dark:bg-zinc-900">
            You will receive a six-part readiness profile, professional
            interpretation of the connections between your answers, prioritised
            practical considerations and a personalised Dispute Readiness Brief
            to download and retain.
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={() => setStarted(true)}>Start assessment</Button>
            <span className="text-sm text-zinc-500">
              24 questions plus 5 context questions
            </span>
          </div>
        </div>
      </main>
    );
  }

  if (questionIndex < questions.length) {
    const question = questions[questionIndex];
    const dimension = dimensions.find(
      (item) => item.key === question.dimension
    )?.label;
    const intro = dimensionIntroductions[question.dimension];
    const isDimensionStart =
      questionIndex === 0 ||
      questions[questionIndex - 1].dimension !== question.dimension;
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between text-sm text-zinc-500">
          <span>{dimension}</span>
          <span>
            {questionIndex + 1} of {questions.length}
          </span>
        </div>
        <div className="mb-8 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-foreground transition-all"
            style={{
              width: `${((questionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
        {isDimensionStart ? (
          <section className="mb-5 rounded-2xl border bg-zinc-50 p-5 dark:bg-zinc-900 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              The Cosil lens
            </p>
            <h2 className="mt-2 text-xl font-semibold">{intro.heading}</h2>
            <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-300">
              {intro.body}
            </p>
          </section>
        ) : null}
        <section className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold leading-8">
            {question.prompt}
          </h2>
          <div className="mt-6 grid gap-3">
            {question.options.map(([label, score]) => (
              <Button
                key={label}
                variant="outline"
                className="h-auto justify-start whitespace-normal py-4 text-left"
                onClick={() => answerQuestion(score)}
              >
                {label}
              </Button>
            ))}
          </div>
          {questionIndex > 0 ? (
            <Button className="mt-5" variant="ghost" onClick={goBack}>
              Back
            </Button>
          ) : null}
        </section>
      </main>
    );
  }

  if (!completed) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between text-sm text-zinc-500">
          <span>Context</span>
          <span>
            {flagIndex + 1} of {complexityFlags.length}
          </span>
        </div>
        <section className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8">
          <p className="mb-3 text-sm text-zinc-500">
            These questions provide context only and do not affect your
            readiness profile.
          </p>
          <h2 className="text-xl font-semibold leading-8">
            {complexityFlags[flagIndex]}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="py-4"
              onClick={() => answerFlag(true)}
            >
              Yes
            </Button>
            <Button
              variant="outline"
              className="py-4"
              onClick={() => answerFlag(false)}
            >
              No
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <div className="rounded-2xl border bg-background p-6 shadow-sm sm:p-9">
        <p className="text-sm font-medium text-zinc-500">Your result</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Your Dispute Readiness Profile
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-600">
          This profile is a diagnostic view of how prepared your current
          dispute position appears across six connected areas. It does not
          assess legal merit, determine rights or predict an outcome.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dimensions.map((dimension) => (
            <div key={dimension.key} className="rounded-xl border p-5">
              <p className="text-sm text-zinc-500">{dimension.label}</p>
              <p className="mt-2 text-xl font-semibold">
                {bandFor(scores[dimension.key])}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border bg-zinc-50 p-5 dark:bg-zinc-900 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Professional interpretation
          </p>
          <h2 className="mt-2 text-xl font-semibold">What your results suggest</h2>
          <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
            {analysis.profileSummary}
          </p>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border p-5 sm:p-6">
            <h2 className="text-xl font-semibold">
              Where you appear better prepared
            </h2>
            <div className="mt-5 space-y-5">
              {analysis.strengths.map((item) => (
                <div key={item.title}>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border p-5 sm:p-6">
            <h2 className="text-xl font-semibold">
              Where attention may be useful
            </h2>
            <div className="mt-5 space-y-5">
              {analysis.priorities.length ? (
                analysis.priorities.map((item) => (
                  <div key={item.title}>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      {item.body}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-zinc-600">
                  No dimension-level gap is currently showing. Your focus is
                  therefore on maintaining clarity and checking whether new
                  evidence, deadlines, complexity or changed objectives alter
                  the picture.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Dispute dynamics
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Important connections in your profile
          </h2>
          <div className="mt-4 space-y-3">
            {analysis.connections.map((connection) => (
              <p
                key={connection}
                className="rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {connection}
              </p>
            ))}
          </div>
        </section>

        {analysis.complexityText ? (
          <section className="mt-8 rounded-2xl border p-5 sm:p-6">
            <h2 className="text-xl font-semibold">Complexity in context</h2>
            <p className="mt-3 leading-7 text-zinc-700">
              {analysis.complexityText}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {analysis.complexityFactors.map((factor) => (
                <span
                  key={factor}
                  className="rounded-full border px-3 py-1 text-xs text-zinc-600"
                >
                  {factor}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {analysis.contextInsight ? (
          <section className="mt-8 rounded-2xl border bg-zinc-50 p-5 dark:bg-zinc-900 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Disputes in context
            </p>
            <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
              {analysis.contextInsight}
            </p>
          </section>
        ) : null}

        <section className="mt-8 rounded-2xl border p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Prioritised
          </p>
          <h2 className="mt-2 text-xl font-semibold">Practical next steps</h2>
          <ol className="mt-5 space-y-4">
            {analysis.nextSteps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold">
                  {index + 1}
                </span>
                <p className="pt-0.5 text-sm leading-6 text-zinc-700">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8 rounded-2xl border p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Before you escalate</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Use these questions to test whether the next step is deliberate,
            proportionate and connected to what remains unresolved.
          </p>
          <ul className="mt-4 space-y-3">
            {analysis.reflections.map((item) => (
              <li key={item} className="text-sm leading-6 text-zinc-700">
                • {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border bg-zinc-950 p-5 text-white sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Included with your Guide
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Your Dispute Readiness Brief
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-zinc-300">
            Download a personalised record of your six-part profile,
            professional interpretation, important connections, complexity
            context and prioritised practical considerations.
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            onClick={() => downloadBriefPdf(dimensions, scores, analysis)}
          >
            Download your Readiness Brief
          </Button>
        </section>

        <section className="mt-10 border-t pt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Further support is optional
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Decide what level of support is proportionate
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-zinc-600">
            {analysis.supportText}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-5">
              <p className="text-sm font-medium text-zinc-500">
                Ongoing support
              </p>
              <h3 className="mt-1 font-semibold">Cosil Membership</h3>
              <p className="mt-1 text-lg font-semibold">£39/month</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Designed for people who want ongoing dispute-readiness
                resources, a monthly live clinic, general updates and member
                benefits without moving straight into bespoke support.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <a href="/membership-waitlist">Join the waitlist</a>
                </Button>
                <Button asChild variant="ghost">
                  <a
                    href="https://whatsapp.com/channel/0029VbDYUmFJf05lwkozbZ01"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Follow Dispute Watch
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-xl border p-5">
              <p className="text-sm font-medium text-zinc-500">
                Bespoke strategic review
              </p>
              <h3 className="mt-1 font-semibold">Explore further support</h3>
              <p className="mt-1 text-lg font-semibold">From £395</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                A Dispute Strategy Consultation can examine your circumstances,
                key issues, evidence, exposure, proportionality and available
                options in greater depth. Scope and price depend on the matter.
              </p>
              <Button asChild className="mt-4">
                <a
                  href="https://cosilsolutions.co.uk/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Explore further support
                </a>
              </Button>
            </div>
          </div>
        </section>

        <div className="mt-8 rounded-xl bg-zinc-50 p-4 text-xs leading-5 text-zinc-500 dark:bg-zinc-900">
          The Dispute Readiness Guide is diagnostic and informational. It does
          not provide legal advice, determine legal rights, assess legal merits
          or predict the outcome of a dispute.
        </div>

        <div className="mt-8">
          <Button variant="outline" onClick={reset}>
            Restart assessment
          </Button>
        </div>
      </div>
    </main>
  );
}
