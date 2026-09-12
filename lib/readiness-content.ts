import "server-only";

export const dimensions = [
  { key: "issuePosition", label: "Issue & Position" },
  { key: "evidenceInformation", label: "Evidence & Information" },
  { key: "exposureStakes", label: "Exposure & Stakes" },
  { key: "actionsEscalation", label: "Actions & Escalation" },
  { key: "optionsAwareness", label: "Options Awareness" },
  { key: "preparedness", label: "Preparedness" },
] as const;

export const dimensionIntroductions = {
  issuePosition: {
    heading: "Separate the dispute from the story around it",
    body: "Disputes become harder to assess when the original issue, later events, assumptions and positions taken begin to merge. Cosil starts by separating those layers. This section tests whether the dispute itself is sufficiently clear before anything is decided about it."
  },
  evidenceInformation: {
    heading: "Test what the information actually establishes",
    body: "Having a large file is not the same as having a clear evidential picture. Cosil looks at whether the available material tells a coherent story, what rests on record rather than recollection, and where uncertainty remains. This section tests the strength of that picture without assessing the merits of your case."
  },
  exposureStakes: {
    heading: "Look beyond the headline issue",
    body: "The amount, complaint or event at the centre of a dispute may be only one part of the exposure. Time, relationships, future dealings, governance, reputation and the consequences of delay can matter too. This section tests how widely you are currently seeing what is at stake."
  },
  actionsEscalation: {
    heading: "Identify what has changed the dispute",
    body: "Not every email, meeting or event carries equal weight. Some actions change tone, narrow positions, introduce formality or become turning points. Cosil examines the dispute as a developing sequence, not simply a chronology. This section tests how clearly you can see that progression."
  },
  optionsAwareness: {
    heading: "See the decision landscape, not just the obvious route",
    body: "A dispute can feel as though it has only one next step, particularly once positions harden. Cosil tests whether the available landscape is understood before strategy is considered. This section examines your awareness of the different ways a matter may be managed, without selecting a route for you."
  },
  preparedness: {
    heading: "Move from reaction to a decision-ready view",
    body: "Being immersed in a dispute can make the latest development feel like the whole problem. Readiness requires enough distance to distinguish what is established, what remains uncertain and what factors genuinely matter to the next decision. This section tests whether you can currently see the matter at that level."
  },
} as const;

export const questions = [
  // ISSUE & POSITION: tests whether the user has separated the dispute itself from the surrounding history, assumptions and emotion.
  { id:"q1_1", dimension:"issuePosition", prompt:"If you had to explain the dispute to someone with no prior knowledge, how clearly could you identify the central issue without relying on the wider history?", options:[["I would struggle to separate the central issue from everything that has happened",0],["I can identify the main issue, although other matters still overlap with it",1],["I can identify the central issue and distinguish it from the wider history",2]] },
  { id:"q1_2", dimension:"issuePosition", prompt:"How clearly do you understand the other party's position, including the main point on which their account or expectations differ from yours?", options:[["I mainly understand my own position",0],["I understand parts of their position, but important differences remain unclear",1],["I can explain their position and the principal areas of difference, even though I disagree with them",2]] },
  { id:"q1_3", dimension:"issuePosition", prompt:"How clearly can you distinguish the outcome you want from the position you have taken so far?", options:[["I have mainly focused on what I believe should happen",0],["I have an outcome in mind, but my position and desired result still overlap",1],["I can distinguish the result I want from the position I have taken in the dispute",2]] },
  { id:"q1_4", dimension:"issuePosition", prompt:"If the disputed points were separated out today, how confidently could you identify what is genuinely contested, what is accepted, and what may simply be unresolved or misunderstood?", options:[["Those categories are not clear to me",0],["I could separate some of them, but not consistently",1],["I could distinguish the genuinely disputed, accepted and unresolved points",2]] },

  // EVIDENCE & INFORMATION: tests coherence, provenance and the distinction between assertion and what the available material actually establishes.
  { id:"q2_1", dimension:"evidenceInformation", prompt:"If your records were reviewed independently, how clearly would they show what happened, what was communicated and where the disagreement arose?", options:[["They would need substantial explanation from me",0],["They would show parts of the picture, but there would be important gaps or ambiguity",1],["They would provide a reasonably coherent account without depending heavily on my explanation",2]] },
  { id:"q2_2", dimension:"evidenceInformation", prompt:"How confidently can you distinguish between what you remember or believe happened and what your available records can actually demonstrate?", options:[["I have not really separated the two",0],["I can distinguish them in some areas, but not throughout the dispute",1],["I have a clear sense of what is supported by records and what currently depends on recollection or interpretation",2]] },
  { id:"q2_3", dimension:"evidenceInformation", prompt:"When you look across the documents and communications you already have, how clear are the significant gaps, inconsistencies or unanswered points?", options:[["I have not assessed the information in that way",0],["I am aware of some gaps or inconsistencies",1],["I can identify where the available information is complete and where material uncertainty remains",2]] },
  { id:"q2_4", dimension:"evidenceInformation", prompt:"Could you trace the key events and important communications in sequence without having to reconstruct the story from memory as you go?", options:[["No, much of the sequence would have to be reconstructed",0],["Broadly, although there are gaps or uncertain dates",1],["Yes, the significant events and communications can be followed in a coherent sequence",2]] },

  // EXPOSURE & STAKES: moves beyond the headline complaint to the consequences of continuation, escalation and precedent.
  { id:"q3_1", dimension:"exposureStakes", prompt:"How clearly can you distinguish the immediate financial issue from the wider financial consequences if the dispute continues?", options:[["I have mainly focused on the immediate amount or cost",0],["I have considered some wider financial effects, but not in a structured way",1],["I have a clear view of both the immediate issue and the wider financial exposure",2]] },
  { id:"q3_2", dimension:"exposureStakes", prompt:"If this dispute remains unresolved, how clearly have you considered what could change in an ongoing relationship, working arrangement, ownership responsibility or governance position?", options:[["I have mainly focused on resolving the immediate disagreement",0],["I have considered some longer-term effects",1],["I have considered how the dispute could affect the continuing relationship or responsibility as well as the immediate issue",2]] },
  { id:"q3_3", dimension:"exposureStakes", prompt:"Beyond obvious deadlines, how clearly have you considered what delay itself could change, restrict or make more difficult?", options:[["I have not considered delay as a separate factor",0],["I am aware delay could matter, but I have not considered its wider effect",1],["I have considered how the passage of time could affect the dispute and the choices available later",2]] },
  { id:"q3_4", dimension:"exposureStakes", prompt:"If the way this dispute is handled were repeated, relied upon or seen by others, how clearly have you considered the wider consequence?", options:[["I have only considered this individual dispute",0],["I can see there may be wider consequences, but they are not yet clear",1],["I have considered whether the handling or outcome could affect future dealings, expectations, reputation or governance",2]] },

  // ACTIONS & ESCALATION: tests awareness of how the history of conduct has shaped the current dispute, without prescribing a next step.
  { id:"q4_1", dimension:"actionsEscalation", prompt:"Looking at what has already been said and done, how clearly can you identify which actions materially changed the course or tone of the dispute?", options:[["I have not distinguished significant actions from the general history",0],["I can identify some turning points, but their significance is not fully clear",1],["I can identify the main actions or communications that changed the position or level of escalation",2]] },
  { id:"q4_2", dimension:"actionsEscalation", prompt:"How clearly can you tell whether the parties are still exploring the issue or have moved into defending fixed positions?", options:[["I am not sure where the dispute sits",0],["There are signs of fixed positions, but the position is mixed",1],["I have a clear sense of whether discussion remains open or positions have become established",2]] },
  { id:"q4_3", dimension:"actionsEscalation", prompt:"How confident are you that you understand any current deadlines, formal stages or time-sensitive requirements, rather than simply knowing that they exist?", options:[["I am not clear whether any apply or what stage the matter has reached",0],["I am aware of some, but I am not fully clear about their significance or timing",1],["I understand the current stage and the deadlines or time-sensitive requirements I am aware of",2]] },
  { id:"q4_4", dimension:"actionsEscalation", prompt:"If you reviewed the dispute from the beginning, could you distinguish between attempts to resolve it and steps that increased its formality or escalation?", options:[["No, I have not looked at the history in those terms",0],["Partly, although some stages overlap or remain unclear",1],["Yes, I can distinguish the main attempts at resolution from the points at which the matter escalated",2]] },

  // OPTIONS AWARENESS: tests whether the user sees the dispute as a decision landscape rather than a single assumed route.
  { id:"q5_1", dimension:"optionsAwareness", prompt:"When you think about what could happen next, are you considering more than the route that currently feels most obvious?", options:[["No, I have mainly assumed there is one realistic route",0],["I know alternatives may exist, but I have not considered them clearly",1],["Yes, I am aware there may be different ways the matter could be managed or progressed",2]] },
  { id:"q5_2", dimension:"optionsAwareness", prompt:"How clearly do you understand the difference between trying to resolve the dispute by agreement and having an outcome determined through a formal process?", options:[["I have not really distinguished between those approaches",0],["I understand the broad difference, but not much beyond that",1],["I understand the broad distinction and that they involve different processes and considerations",2]] },
  { id:"q5_3", dimension:"optionsAwareness", prompt:"When comparing possible ways forward, how clearly have you considered that the consequences may extend beyond whether you ultimately 'win' or 'lose'?", options:[["I have mainly thought about the final outcome",0],["I recognise there are other consequences, but have not considered them in much depth",1],["I recognise that different routes can affect time, cost, relationships, control and uncertainty differently",2]] },
  { id:"q5_4", dimension:"optionsAwareness", prompt:"Have you considered which of the paths open to you would be hardest to reverse, whether because of cost, time, or the effect on the relationship?", options:[["Not really",0],["To some extent",1],["Yes, I've thought this through",2]] },

  // PREPAREDNESS: tests whether the user can move from narrative and reaction to a coherent decision position.
  { id:"q6_1", dimension:"preparedness", prompt:"If a senior adviser or decision-maker asked you today, 'What do I need to understand about this dispute first?', how prepared would you be to give a focused answer?", options:[["I would probably start with the full history",0],["I could identify the main points, but would need time to organise them",1],["I could give a focused account of the issue, current position and material context",2]] },
  { id:"q6_2", dimension:"preparedness", prompt:"How clearly can you separate the information you already have from the uncertainties that are still affecting your ability to make a decision?", options:[["They are still mixed together",0],["I can identify some uncertainties, but not all of them",1],["I can distinguish what is established from the material uncertainties that remain",2]] },
  { id:"q6_3", dimension:"preparedness", prompt:"If you had to make an informed decision about the dispute today, how clearly could you explain the factors you would need to weigh, without deciding the answer itself?", options:[["I would mainly rely on how I currently feel about the dispute",0],["I can identify some relevant factors, but my thinking is not yet structured",1],["I can identify the main factors that would need to be weighed before a decision is made",2]] },
  { id:"q6_4", dimension:"preparedness", prompt:"Stepping back from the immediate pressure of the dispute, how confident are you that you can see the matter as a whole rather than reacting to the latest development?", options:[["The latest development is largely driving my thinking",0],["I can step back to some extent, although immediate events still influence my view",1],["I can consider the wider dispute, its history and its implications alongside the latest development",2]] },
] as const;

export const complexityFlags = [
  "Have formal proceedings or a formal process already begun?",
  "Is there a known deadline or time-sensitive requirement?",
  "Could the financial, property or business consequences be significant?",
  "Are multiple parties or organisations involved?",
  "Are professional advisers already involved?",
] as const;
