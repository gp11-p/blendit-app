import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getClientKey,
  rateLimit,
  tooManyRequestsResponse,
} from "@/lib/rateLimit";

const client = new Anthropic();

const PlanItemSchema = z.object({
  food: z.string(),
  quantity: z.string(),
});

const MealSchema = z.object({
  name: z.string(),
  items: z.array(PlanItemSchema),
});

const DaySchema = z.object({
  day: z.string(),
  meals: z.array(MealSchema),
});

const PlanImportSchema = z.object({
  recognized: z.boolean(),
  reason: z.string(),
  days: z.array(DaySchema),
});

const SYSTEM_PROMPT = `Sei un assistente che trasforma un piano alimentare scritto da un nutrizionista (PDF o foto) in una struttura leggibile, per una demo commerciale mostrata al nutrizionista stesso.

Regole:
- Ricostruisci i giorni, per ogni giorno i pasti, e per ogni pasto gli alimenti con la quantità esattamente come scritta nel documento (es. "80g", "1 porzione", "q.b."). Non convertire unità e non inventare quantità assenti.
- Non aggiungere alimenti, pasti o giorni che non sono nel documento.
- Se il documento è davvero un piano alimentare leggibile, restituisci recognized: true, reason: stringa vuota, days valorizzato.
- Se il documento NON è un piano alimentare leggibile (altro tipo di documento, scansione illeggibile, file vuoto, contenuto che non è un piano pasti), restituisci recognized: false, un reason breve e onesto in italiano che spiega perché, e days come array vuoto. In questo caso NON inventare una struttura plausibile: un'importazione sbagliata ma credibile è peggio di un errore dichiarato.`;

const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

// Il documento importato in una demo di vendita può avere più pagine di una
// singola foto del frigo, quindi il tetto è più alto di quello di /api/vision
// — ma resta un tetto: senza limite chiunque potrebbe far esplodere il costo
// di una singola chiamata con un file costruito ad arte.
// ~10.7 milioni di caratteri base64 ≈ 8MB di file originale.
const MAX_FILE_BASE64_LENGTH = 10_700_000;

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

  if (file.length > MAX_FILE_BASE64_LENGTH) {
    return NextResponse.json(
      { error: "Il file è troppo grande. Riprova con un file più leggero." },
      { status: 413 }
    );
  }

  const isPdf = mediaType === "application/pdf";
  const resolvedImageType = (
    VALID_IMAGE_TYPES as readonly string[]
  ).includes(mediaType as string)
    ? (mediaType as (typeof VALID_IMAGE_TYPES)[number])
    : "image/jpeg";

  try {
    const message = await client.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      output_config: { format: zodOutputFormat(PlanImportSchema) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            isPdf
              ? {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: "application/pdf",
                    data: file,
                  },
                }
              : {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: resolvedImageType,
                    data: file,
                  },
                },
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
