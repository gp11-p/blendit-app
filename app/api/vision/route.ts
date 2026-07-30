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

const VisionSchema = z.object({
  ingredients: z.array(z.string()),
});

const SYSTEM_PROMPT = `Guarda la foto di un frigo o di una dispensa ed elenca solo gli ingredienti alimentari che riconosci chiaramente.

Regole:
- Massimo 15 ingredienti principali.
- Nomi brevi in italiano, es. "pomodori" non "3 pomodori maturi".
- Solo cibo/ingredienti: ignora contenitori, mensole, altri oggetti.
- Se non riconosci alcun ingrediente chiaro, restituisci un array vuoto.`;

const VALID_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

// L'analisi di una foto costa più di una ricetta di solo testo (l'immagine
// occupa molti token), quindi il limite è più stretto.
const VISION_LIMIT = 10;
const VISION_WINDOW_MS = 10 * 60 * 1000;

// Il client comprime già le foto sopra i 2MB, ma il server non può fidarsi di
// quello che gli arriva: una richiesta costruita a mano potrebbe mandare
// un'immagine enorme e far esplodere il costo della singola chiamata.
// ~3 milioni di caratteri base64 ≈ 2.2MB di immagine.
const MAX_IMAGE_BASE64_LENGTH = 3_000_000;

export async function POST(request: Request) {
  const limit = rateLimit(
    getClientKey(request, "vision"),
    VISION_LIMIT,
    VISION_WINDOW_MS
  );
  if (!limit.allowed) {
    return tooManyRequestsResponse(
      limit,
      "Hai analizzato tante foto in poco tempo. Riprova tra qualche minuto."
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

  const { image, mediaType } = (body ?? {}) as {
    image?: unknown;
    mediaType?: unknown;
  };

  if (typeof image !== "string" || image.length === 0) {
    return NextResponse.json(
      { error: "Nessuna immagine ricevuta." },
      { status: 400 }
    );
  }

  if (image.length > MAX_IMAGE_BASE64_LENGTH) {
    return NextResponse.json(
      { error: "La foto è troppo grande. Riprova con uno scatto più leggero." },
      { status: 413 }
    );
  }

  const resolvedMediaType = (
    VALID_MEDIA_TYPES as readonly string[]
  ).includes(mediaType as string)
    ? (mediaType as (typeof VALID_MEDIA_TYPES)[number])
    : "image/jpeg";

  try {
    const message = await client.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      output_config: { format: zodOutputFormat(VisionSchema) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: resolvedMediaType,
                data: image,
              },
            },
            {
              type: "text",
              text: "Elenca gli ingredienti che vedi in questa foto.",
            },
          ],
        },
      ],
    });

    if (message.stop_reason === "refusal" || !message.parsed_output) {
      return NextResponse.json(
        { error: "Non sono riuscito ad analizzare la foto. Riprova." },
        { status: 502 }
      );
    }

    return NextResponse.json(message.parsed_output);
  } catch (error) {
    console.error("Errore analisi foto:", error);
    return NextResponse.json(
      { error: "Non sono riuscito ad analizzare la foto. Riprova." },
      { status: 502 }
    );
  }
}
