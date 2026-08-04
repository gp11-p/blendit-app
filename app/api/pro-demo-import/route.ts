import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import {
  getClientKey,
  rateLimit,
  tooManyRequestsResponse,
} from "@/lib/rateLimit";
import {
  buildPlanFileContentBlock,
  MAX_PLAN_FILE_BASE64_LENGTH,
  PLAN_IMPORT_SYSTEM_PROMPT,
  PlanImportSchema,
} from "@/lib/planImport";

const client = new Anthropic();

const IMPORT_LIMIT = 8;
const IMPORT_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const limit = rateLimit(
    getClientKey(request, "pro-demo-import"),
    IMPORT_LIMIT,
    IMPORT_WINDOW_MS
  );
  if (!limit.allowed) {
    return tooManyRequestsResponse(
      limit,
      "Hai importato tanti file in poco tempo. Riprova tra qualche minuto."
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurata sul server." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo della richiesta non valido." },
      { status: 400 }
    );
  }

  const { file, mediaType } = (body ?? {}) as {
    file?: unknown;
    mediaType?: unknown;
  };

  if (typeof file !== "string" || file.length === 0) {
    return NextResponse.json(
      { error: "Nessun file ricevuto." },
      { status: 400 }
    );
  }

  if (file.length > MAX_PLAN_FILE_BASE64_LENGTH) {
    return NextResponse.json(
      { error: "Il file è troppo grande. Riprova con un file più leggero." },
      { status: 413 }
    );
  }

  try {
    const message = await client.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      output_config: { format: zodOutputFormat(PlanImportSchema) },
      system: PLAN_IMPORT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            buildPlanFileContentBlock(file, mediaType),
            {
              type: "text",
              text: "Trasforma questo piano alimentare nella struttura richiesta.",
            },
          ],
        },
      ],
    });

    if (message.stop_reason === "refusal" || !message.parsed_output) {
      return NextResponse.json(
        { error: "Non sono riuscito a leggere il file. Riprova." },
        { status: 502 }
      );
    }

    return NextResponse.json(message.parsed_output);
  } catch (error) {
    console.error("Errore import piano:", error);
    return NextResponse.json(
      { error: "Non sono riuscito a leggere il file. Riprova." },
      { status: 502 }
    );
  }
}
