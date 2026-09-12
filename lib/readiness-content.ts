import "server-only";

export const dimensions = [
  { key: "issuePosition", label: "Issue & Position" },
  { key: "evidenceInformation", label: "Evidence & Information" },
  { key: "exposureStakes", label: "Exposure & Stakes" },
  { key: "actionsEscalation", label: "Actions & Escalation" },
  { key: "optionsAwareness", label: "Options Awareness" },
  { key: "preparedness", label: "Preparedness" },
] as const;

export const questions = [
  { id:"q1_1", dimension:"issuePosition", prompt:"How clearly could you summarise, in a few sentences, what the dispute is actually about?", options:[["Not clearly at all",0],["I could give a general idea, but not a precise summary",1],["Very clearly",2]] },
  { id:"q1_2", dimension:"issuePosition", prompt:"Do you understand what the other party's position or view of the situation is, even if you disagree with it?", options:[["No, I don't know their position",0],["I have some idea, but I'm not fully sure",1],["Yes, I understand their position",2]] },
  { id:"q1_3", dimension:"issuePosition", prompt:"Are you clear on what outcome you are actually seeking from this situation?", options:[["No, I haven't defined this",0],["I have a rough idea",1],["Yes, this is clear to me",2]] },
  { id:"q1_4", dimension:"issuePosition", prompt:"Do you know which specific points are agreed between you and the other party, and which are genuinely in dispute?", options:[["No, this isn't clear",0],["Partly, some points are clear and others aren't",1],["Yes, this is clear",2]] },

  { id:"q2_1", dimension:"evidenceInformation", prompt:"Do you have the key documents relevant to this situation, such as contracts, correspondence or notices, in one place?", options:[["No, they are scattered or missing",0],["Some are gathered, others aren't",1],["Yes, they are gathered together",2]] },
  { id:"q2_2", dimension:"evidenceInformation", prompt:"Could you currently put together a clear timeline of the key events in order?", options:[["No",0],["I could attempt one, but it would have gaps",1],["Yes",2]] },
  { id:"q2_3", dimension:"evidenceInformation", prompt:"Do you have written records, such as letters, emails or messages, covering the main points of disagreement?", options:[["No, mostly verbal or undocumented",0],["Some written records exist",1],["Yes, the main points are documented",2]] },
  { id:"q2_4", dimension:"evidenceInformation", prompt:"If someone else needed to understand this situation from your records alone, could they do so?", options:[["No, they'd need a lot explained to them",0],["They could get a partial picture",1],["Yes, largely",2]] },

  { id:"q3_1", dimension:"exposureStakes", prompt:"Have you identified what could be financially affected if this situation continues or escalates?", options:[["No",0],["I have a rough sense",1],["Yes, clearly",2]] },
  { id:"q3_2", dimension:"exposureStakes", prompt:"Have you considered how this situation could affect relationships, for example with a neighbour, tenant, business contact, board or colleague?", options:[["No, I haven't thought about this",0],["I've thought about it briefly",1],["Yes, I've considered this carefully",2]] },
  { id:"q3_3", dimension:"exposureStakes", prompt:"Have you considered any time-related consequences, such as delays, deadlines or ongoing disruption?", options:[["No",0],["Somewhat",1],["Yes",2]] },
  { id:"q3_4", dimension:"exposureStakes", prompt:"Have you considered any wider consequences beyond the immediate issue, such as reputation, precedent or future decisions this could affect?", options:[["No",0],["I've thought about this a little",1],["Yes, I've considered this",2]] },

  { id:"q4_1", dimension:"actionsEscalation", prompt:"Are you clear about what actions or communications have already taken place in this dispute?", options:[["No, not clearly",0],["Partly",1],["Yes, clearly",2]] },
  { id:"q4_2", dimension:"actionsEscalation", prompt:"Have you already sent or received communication that sets out a firm position rather than an open discussion?", options:[["Yes, and positions feel fixed already",0],["Some firm positions have been stated",1],["No, the situation is still open, or positions remain flexible",2]] },
  { id:"q4_3", dimension:"actionsEscalation", prompt:"Are you aware of any deadlines or time limits that already apply to this situation?", options:[["No, I haven't checked",0],["I think there might be, but I'm not certain",1],["Yes, I'm aware of any that apply",2]] },
  { id:"q4_4", dimension:"actionsEscalation", prompt:"Could you currently explain, in order, what has happened so far in this dispute?", options:[["No, not clearly",0],["Roughly, but with gaps",1],["Yes, clearly",2]] },

  { id:"q5_1", dimension:"optionsAwareness", prompt:"Are you aware that disputes like this can generally be handled in more than one way, for example direct negotiation, mediation or a formal process?", options:[["No",0],["I have a general awareness",1],["Yes",2]] },
  { id:"q5_2", dimension:"optionsAwareness", prompt:"Do you broadly understand the different types of ways a dispute may be managed or progressed?", options:[["No",0],["I have a general idea",1],["Yes",2]] },
  { id:"q5_3", dimension:"optionsAwareness", prompt:"Are you aware that different options may have different implications for cost, time and relationships?", options:[["No",0],["I have some awareness",1],["Yes",2]] },
  { id:"q5_4", dimension:"optionsAwareness", prompt:"Do you know, broadly, where you could go to get further guidance on the options available to you?", options:[["No",0],["I have some idea",1],["Yes",2]] },

  { id:"q6_1", dimension:"preparedness", prompt:"If you needed to explain this situation to someone else today, such as an adviser, colleague or board, how ready would you feel?", options:[["Not ready at all",0],["Somewhat ready",1],["Well prepared",2]] },
  { id:"q6_2", dimension:"preparedness", prompt:"Do you feel you currently have what you need to decide your next step?", options:[["No",0],["Partly",1],["Yes",2]] },
  { id:"q6_3", dimension:"preparedness", prompt:"Are there important aspects of the situation that are still unclear to you?", options:[["Yes, several",0],["Yes, some",1],["No, the main points are clear to me",2]] },
  { id:"q6_4", dimension:"preparedness", prompt:"Overall, how in control of this situation do you currently feel?", options:[["Not very in control",0],["Somewhat in control",1],["In control",2]] },
] as const;

export const complexityFlags = [
  "Have formal proceedings or a formal process already begun?",
  "Is there a known deadline or time-sensitive requirement?",
  "Could the financial, property, or business consequences be significant?",
  "Are multiple parties or organisations involved?",
  "Are professional advisers already involved?",
] as const;
