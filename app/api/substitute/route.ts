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

const AlternativeSchema = z.object({
  name: z.string(),
  note: z.string(),
});

const SubstituteSchema = z.object({
  found: z.boolean(),
  alternatives: z.array(AlternativeSchema),
  revisedSteps: z.array(z.string()),
});

const SYSTEM_PROMPT = `Sei uno chef assistente per l'app Blendit. L'utente sta seguendo una ricetta e gli manca un ingrediente.

Regole:
- Proponi al massimo 2 alternative, SOLO scegliendo tra gli ingredienti che l'utente ha già in dispensa (elencati sotto). Non proporre mai di comprare qualcosa.
- Ogni alternativa ha "name" (il nome esatto, così come compare nella dispensa) e "note", una frase breve su come usarla al posto dell'ingrediente mancante o su cosa cambia nel risultato.
- Se nessun ingrediente in dispensa è un sostituto sensato per questo piatto, imposta found=false, alternatives=[], e restituisci in revisedSteps esattamente gli stessi passi ricevuti in input, senza modificarli: è un risultato normale, non un errore, meglio di un'alternativa inventata.
- Se trovi almeno un'alternativa sensata, imposta found=true e riscrivi in revisedSteps l'intera lista dei passi (stesso numero di elementi, stesso ordine): modifica solo i passi che nominano l'ingrediente mancante, sostituendolo con la prima alternativa (menziona la seconda tra parentesi solo se naturale). Lascia invariati alla lettera tutti gli altri passi.`;

const SUBSTITUTE_LIMIT = 15;
const SUBSTITUTE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const limit = rateLimit(
    getClientKey(request, "substitute"),
    SUBSTITUTE_LIMIT,
    SUBSTITUTE_WINDOW_MS
  );
  if (!limit.allowed) {
    return tooManyRequestsResponse(
      limit,
      "Hai cercato tante sostituzioni in poco tempo. Riprova tra qualche minuto."
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

  const bodyObject = (body ?? {}) as Record<string, unknown>;
  const missingIngredient = bodyObject.missingIngredient;
  const recipeTitle = bodyObject.recipeTitle;
  const steps = bodyObject.steps;
  const availableIngredients = bodyObject.availableIngredients;

  if (
    typeof missingIngredient !== "string" ||
    missingIngredient.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "Manca l'ingrediente da sostituire." },
      { status: 400 }
    );
  }
  if (typeof recipeTitle !== "string" || recipeTitle.trim().length === 0) {
    return NextResponse.json(
      { error: "Manca il titolo della ricetta." },
      { status: 400 }
    );
  }
  if (
    !Array.isArray(steps) ||
    steps.length === 0 ||
    !steps.every((step) => typeof step === "string")
  ) {
    return NextResponse.json(
      { error: "Mancano i passi della ricetta." },
      { status: 400 }
    );
  }
  if (
    !Array.isArray(availableIngredients) ||
    !availableIngredients.every((item) => typeof item === "string")
  ) {
    return NextResponse.json(
      { error: "Elenco della dispensa non valido." },
      { status: 400 }
    );
  }

  try {
    const message = await client.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 2048,
      output_config: { format: zodOutputFormat(SubstituteSchema) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Ricetta: ${recipeTitle}.
Passi attuali:
${steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

Ingrediente mancante: ${missingIngredient}.

Ingredienti in dispensa: ${
            availableIngredients.length > 0
              ? availableIngredients.join(", ")
              : "(dispensa vuota)"
          }.`,
        },
      ],
    });

    if (message.stop_reason === "refusal" || !message.parsed_output) {
      return NextResponse.json(
        { error: "Non sono riuscito a trovare un'alternativa. Riprova." },
        { status: 502 }
      );
    }

    return NextResponse.json(message.parsed_output);
  } catch (error) {
    console.error("Errore ricerca sostituzione:", error);
    return NextResponse.json(
      { error: "Non sono riuscito a trovare un'alternativa. Riprova." },
      { status: 502 }
    );
  }
}
