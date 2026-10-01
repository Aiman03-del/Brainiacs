import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const MAX_MESSAGES = 20;
const MAX_USER_CHARS = 4000;
const MAX_ASSISTANT_CHARS = 8000;

const SYSTEM_PROMPT = [
  "You are Brainiacs AI, a helpful assistant inside a team collaboration app.",
  "Help with task planning, breaking work into steps, writing and rewriting messages,",
  "brainstorming, summarizing text and answering general questions.",
  "Reply in the same language the user writes in.",
  "Reply in plain text only. Do not use markdown symbols such as asterisks, hashes or backticks.",
  "For lists, use a simple dash at the start of each line.",
  "Keep answers clear and concise.",
].join(" ");

const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;
const hits = new Map();

function isRateLimited(userId) {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(userId, recent);
    return true;
  }
  recent.push(now);
  hits.set(userId, recent);
  return false;
}

function parseMessages(body) {
  if (!body || !Array.isArray(body.messages)) return null;

  const cleaned = [];
  for (const message of body.messages.slice(-MAX_MESSAGES)) {
    if (
      !message ||
      (message.role !== "user" && message.role !== "assistant") ||
      typeof message.content !== "string"
    ) {
      return null;
    }
    const limit = message.role === "user" ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS;
    const content = message.content.trim().slice(0, limit);
    if (content) cleaned.push({ role: message.role, content });
  }

  if (!cleaned.length || cleaned[cleaned.length - 1].role !== "user") {
    return null;
  }
  return cleaned;
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Please log in first." }, { status: 401 });
  }

  if (isRateLimited(user.id)) {
    return Response.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not set");
    return Response.json(
      { error: "The AI assistant is not configured yet." },
      { status: 500 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages = parseMessages(body);
  if (!messages) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const groq = new Groq({ apiKey });

  let completion;
  try {
    completion = await groq.chat.completions.create(
      {
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
        temperature: 0.6,
        max_completion_tokens: 1024,
        ...(MODEL.startsWith("openai/gpt-oss")
          ? { reasoning_effort: "low" }
          : {}),
      },
      { signal: request.signal },
    );
  } catch (error) {
    console.error("Groq request failed:", error?.status, error?.message);
    const busy = error?.status === 429;
    return Response.json(
      {
        error: busy
          ? "The AI is busy right now. Please try again shortly."
          : "The AI service is unavailable. Please try again.",
      },
      { status: busy ? 429 : 502 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const text = chunk.choices?.[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (error) {
        if (request.signal.aborted) {
          try {
            controller.close();
          } catch {
            // The stream may already be closed.
          }
        } else {
          console.error("Groq stream failed:", error?.message);
          controller.error(error);
        }
      }
    },
    cancel() {
      completion.controller?.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}