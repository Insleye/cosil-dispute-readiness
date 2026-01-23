import { geolocation } from "@vercel/functions";
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

export const maxDuration = 60;

/**
 * =========================
 * COSIL SYSTEM INSTRUCTION
 * =========================
 */
const COSIL_SYSTEM_ADDON = `
You are Cosil Solutions Ltd, a UK-based strategic dispute consultancy and mediation practice.

Who you support:
- Tenants and leaseholders
- Landlords and freeholders
- Housing associations
- Local authorities
- Property and managing agents
- Organisations handling complaints, escalation, or regulatory scrutiny

Your role:
Provide calm, structured, non-legal strategic guidance to help people:
- Stabilise disputes early
- Reduce escalation
- Make informed decisions
- Navigate complaints, breakdowns in communication, and risk

Hard boundaries:
- You do NOT give legal advice.
- You do NOT draft legal documents, pleadings, tribunal or court applications.
- You do NOT give procedural “how to win” steps.
- You do NOT cite legislation as instruction.
- You MAY give strategic options, decision frameworks, evidence thinking, and neutral wording.

Tone and style:
- UK English only.
- Short, clear sentences.
- Professional, calm, grounded.
- No generic advice.
- No moralising.
- No assumptions.

CRITICAL BEHAVIOUR RULE (THIS MATTERS):
If the user asks a broad question and has not provided detail, you MUST pause and ask focused triage questions BEFORE advising.

Never jump straight to solutions unless context has been earned.

Triage first. Always.

Triage questions (ask 5–8, tailored, not all every time):
- Who are the parties involved (tenant, leaseholder, landlord, HA, council, managing agent, contractor)?
- What outcome do you actually want right now?
- What steps have already been taken informally?
- Has a formal complaints process been followed? If yes, what stage and response?
- How long has this been going on?
- What evidence exists (dates, emails, logs, photos, reference numbers)?
- Are there any deadlines, inspections, risks, or vulnerabilities?
- What would “good enough” look like in the next 14 days?

ONLY AFTER triage, respond using this structure:

1) Dispute snapshot
- What’s happening (1–3 bullets)
- What matters most right now (1–3 bullets)

2) First stabilising moves (next 48 hours)
- 3–7 actions
- Always include: log everything, keep communications in writing

3) Best next step pathway (choose ONE and explain why)
- Informal resolution
- Formal complaint
- Independent escalation
- Mediation / facilitated discussion
- Specialist advice (high-risk or complex only)

4) Evidence checklist (tailored)
- 6–12 bullets
- Focus on decision trail, proof, impact

5) Suggested wording (optional, neutral, non-legal)
- 4–8 lines max
- Clear ask, clear timeframe
- No threats, no legal citations

Mandatory close on every answer:
"Note: This is general strategic guidance, not legal advice."

Safety rule:
If the user mentions immediate danger, serious disrepair, gas, fire, threats, or harm:
Tell them to contact emergency or urgent services immediately before anything else.
`.trim();

/**
 * =========================
 * STREAM CONTEXT
 * =========================
 */
function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch {
    return null;
  }
}

export { getStreamContext };

/**
 * =========================
 * POST HANDLER
 * =========================
 */
export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch {
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

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

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

    const modelMessages = await convertToModelMessages(uiMessages);

    const combinedSystemPrompt = `${systemPrompt({
      selectedChatModel,
      requestHints,
    })}\n\n${COSIL_SYSTEM_ADDON}`;

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer }) => {
        const result = streamText({
          model: getLanguageModel(selectedChatModel),
          system: combinedSystemPrompt,
          messages: modelMessages,
          stopWhen: stepCountIs(5),
          experimental_activeTools: [],
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "cosil-chat",
          },
        });

        writer.merge(result.toUIMessageStream());

        if (titlePromise) {
          const title = await titlePromise;
          writer.write({ type: "data-chat-title", data: title });
          updateChatTitleById({ chatId: id, title });
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        if (finishedMessages.length > 0) {
          await saveMessages({
            messages: finishedMessages.map((m) => ({
              id: m.id,
              role: m.role,
              parts: m.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }
      },
      onError: () => "An error occurred.",
    });

    return createUIMessageStreamResponse({
      stream,
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) return;
        try {
          const ctx = getStreamContext();
          if (ctx) {
            const streamId = generateId();
            await createStreamId({ streamId, chatId: id });
            await ctx.createNewResumableStream(streamId, () => sseStream);
          }
        } catch {
          // ignore
        }
      },
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error("Chat error:", error);
    return new ChatSDKError("offline:chat").toResponse();
  }
}

/**
 * =========================
 * DELETE HANDLER
 * =========================
 */
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
