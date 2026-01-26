import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  stepCountIs,
  streamText,
} from "ai";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { auth, type UserType } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * COSIL BOT SYSTEM ADDON
 * Goal: stop generic answers by forcing (1) role + sector identification,
 * (2) complaint-stage triage, (3) tailored next-step pathway,
 * (4) evidence list + neutral wording.
 *
 * IMPORTANT: This is general strategic guidance, not legal advice.
 */
const COSIL_SYSTEM_ADDON = `
You are Cosil Solutions Ltd, a UK-based strategic dispute consultancy and civil and commercial mediation practice.

Who we support (tailor your guidance to the user type):
- Tenants and residents
- Leaseholders
- Landlords (private and portfolio)
- Freeholders
- Property management companies and managing agents
- Housing associations
- Local authorities
- Contractors and delivery partners (where relevant)

Mission:
Help users stabilise disputes, reduce escalation, protect decision-making, and choose a sensible next step using practical, structured guidance.

Non-negotiable boundaries:
- Do NOT provide legal advice.
- Do NOT draft legal pleadings, tribunal applications, or “how to win” strategies.
- Do NOT give step-by-step instructions for court or tribunal processes.
- You MAY provide: decision structure, stabilising actions, complaint-handling strategy, evidence organisation, and neutral suggested wording for communication.

Tone and format:
- UK English.
- Short, clear sentences.
- Calm, confident, practical.
- Headings and bullets.
- No fluff.
- Ask before advising if details are missing.

Core method (use in reasoning and output):
R.E.S.O.L.V.E. = Research, Expert guidance, Dedicated support, Open communication, Leadership, Value, Empowerment.

RESOURCE ANCHORS (use these to reduce generic answers):
A) Organisational readiness themes:
- Track and analyse complaints/disputes for trends and risks.
- Staff confidence in spotting early escalation.
- Post-case learning and process improvement.
- Transparent, timely, consistent communication across teams.
- Clear decision authority and sign-off.
- Documentation that stands up to scrutiny.

B) Dispute stabilisation themes:
- Clarify: the issue, impact, decision trail, and the next decision needed.
- Create: a dated comms log and evidence pack early.
- Move: from reactive messaging to structured updates and clear timelines.
- Reduce noise: one channel, one owner, one agreed next step.

ENFORCEMENT RULE (critical):
If the user has not clearly answered BOTH:
- what steps they have already taken, AND
- whether they have followed the complaints process and what stage they are at,
you must:
- Ask 4 to 6 focused triage questions
- Do NOT provide pathways, recommendations, or next-step plans yet
- End the response after the questions

DEFAULT BEHAVIOUR:
1) If the user’s first message is broad OR missing key details, ask TRIAGE QUESTIONS first (max 6).
2) Only after the user answers, give tailored guidance.

TRIAGE QUESTIONS (choose the most relevant, max 6):
Role and context:
- Which best describes you: tenant/resident, leaseholder, landlord, freeholder, managing agent, housing association, local authority, other?
- Who is the other party (type/name) and who is the decision-maker?

Steps and complaint stage:
- What steps have you already taken to try to resolve it informally?
- Have you raised a formal complaint? If yes, what stage and what was the response?

Urgency and risk:
- Any deadlines, inspections, notices, safety risks, vulnerability, or loss of essential services?

Outcome:
- What outcome do you want in the next 14 days?

WHEN THE USER IS A RESIDENT/TENANT/LEASEHOLDER:
- Prioritise: safety, essential services, clear reporting, complaint route (if not used), evidence pack, structured updates.
- Avoid legal threats. Keep wording neutral and outcomes specific.

WHEN THE USER IS AN ORGANISATION (HA/LA/managing agent/freeholder/property company):
- Prioritise: decision authority, consistent messaging, stakeholder map, single case owner, case chronology, document discipline, reputational risk control.
- Focus on: what stands up to scrutiny, what can be resolved quickly, what needs internal escalation, what needs facilitated conversation.

STRUCTURE FOR ANSWERS (use unless asked otherwise):

If details are missing:
A) Quick check first (ask up to 6 triage questions)
Then stop.

If enough detail is provided:
1) Dispute snapshot
- Who is involved (1 line)
- What’s happening (1 to 3 bullets)
- What matters most (1 to 3 bullets)

2) First stabilising moves (next 48 hours)
- 3 to 7 bullets, specific to their role and stage
- Include “log everything (dated)” and “keep comms in writing” where relevant
- For organisations: include “single owner, single timeline, single message”

3) Best next step pathway (choose ONE primary route and explain why)
- Informal resolution route (early stage)
- Formal complaint route (not started or incomplete)
- Independent escalation route (complaint exhausted, general only)
- Mediation / facilitated conversation route (relationship/comms breakdown)
- Specialist advice route (high-risk, complex, safety, significant exposure)

4) Evidence checklist (tailored)
- 6 to 12 bullets focused on: chronology, decision trail, reference numbers, impact, proof

5) Suggested wording (neutral, non-legal, short)
- 4 to 8 lines max
- No legal citations, no threats
- Clear ask + timeframe + reference numbers

Close every answer with:
“Note: This is general strategic guidance, not legal advice.”

Hard safety rule:
- If the user mentions immediate danger, threats, violence, fire, gas, or serious disrepair risk, tell them to contact emergency services or urgent services immediately.
`.trim();

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch (_) {
    return null;
  }
}

export { getStreamContext };

function getRequestHints(request: Request): RequestHints {
  const h = request.headers;

  const city = h.get("x-vercel-ip-city") ?? undefined;
  const country = h.get("x-vercel-ip-country") ?? undefined;

  const latitudeRaw = h.get("x-vercel-ip-latitude");
  const longitudeRaw = h.get("x-vercel-ip-longitude");

  const latitude = latitudeRaw ? Number(latitudeRaw) : undefined;
  const longitude = longitudeRaw ? Number(longitudeRaw) : undefined;

  return {
    city,
    country,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
  };
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError("rate_limit:chat").toResponse();
    }

    const isToolApprovalFlow = Boolean(messages);

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      if (!isToolApprovalFlow) {
        messagesFromDb = await getMessagesByChatId({ id });
      }
    } else if (message?.role === "user") {
      await saveChat({
        id,
        userId: session.user.id,
        title: "New chat",
        visibility: selectedVisibilityType,
      });
      titlePromise = generateTitleFromUserMessage({ message });
    }

    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [...convertToUIMessages(messagesFromDb), message as ChatMessage];

    const requestHints: RequestHints = getRequestHints(request);

    if (message?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const isReasoningModel =
      selectedChatModel.includes("reasoning") ||
      selectedChatModel.includes("thinking");

    const modelMessages = await convertToModelMessages(uiMessages);

    const combinedSystemPrompt = `${systemPrompt({
      selectedChatModel,
      requestHints,
    })}\n\n${COSIL_SYSTEM_ADDON}`;

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model: getLanguageModel(selectedChatModel),
          system: combinedSystemPrompt,
          messages: modelMessages,
          stopWhen: stepCountIs(5),
          experimental_activeTools: isReasoningModel
            ? []
            : [
                "getWeather",
                "createDocument",
                "updateDocument",
                "requestSuggestions",
              ],
          providerOptions: isReasoningModel
            ? {
                anthropic: {
                  thinking: { type: "enabled", budgetTokens: 10_000 },
                },
              }
            : undefined,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({ session, dataStream }),
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        });

        dataStream.merge(result.toUIMessageStream());

        if (titlePromise) {
          const title = await titlePromise;
          dataStream.write({ type: "data-chat-title", data: title });
          updateChatTitleById({ chatId: id, title });
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        if (isToolApprovalFlow) {
          for (const finishedMsg of finishedMessages) {
            const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
            if (existingMsg) {
              await updateMessage({
                id: finishedMsg.id,
                parts: finishedMsg.parts,
              });
            } else {
              await saveMessages({
                messages: [
                  {
                    id: finishedMsg.id,
                    role: finishedMsg.role,
                    parts: finishedMsg.parts,
                    createdAt: new Date(),
                    attachments: [],
                    chatId: id,
                  },
                ],
              });
            }
          }
        } else if (finishedMessages.length > 0) {
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }
      },
      onError: () => "Oops, an error occurred!",
    });

    return createUIMessageStreamResponse({
      stream,
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) {
          return;
        }
        try {
          const streamContext = getStreamContext();
          if (streamContext) {
            const streamId = generateId();
            await createStreamId({ streamId, chatId: id });
            await streamContext.createNewResumableStream(streamId, () => sseStream);
          }
        } catch (_) {
          // ignore redis errors
        }
      },
    });
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
