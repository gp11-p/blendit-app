import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";

const client = new Anthropic();

const RecipeSchema = z.object({
  title: z.string(),
  time: z.string(),
  difficulty: z.enum(["Facile", "Media", "Difficile"]),
  missingIngredients: z.array(z.string()),
  steps: z.array(z.string()),
});

const SYSTEM_PROMPT = `Sei uno chef assistente per l'app Blendit. Dato un elenco di ingredienti disponibili, proponi UNA ricetta realizzabile con quello che l'utente ha, in italiano.

Regole:
- Se manca qualcosa di essenziale per completare il piatto, elencalo in missingIngredients (massimo 2 elementi). Se non manca nulla, restituisci un array vuoto.
- steps contiene i passi in ordine, uno per elemento, brevi e chiari.
- time è il tempo totale stimato, es. "25 min".`;

export async function POST(request: Request) {
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

  const ingredients =
    typeof body === "object" && body !== null && "ingredients" in body
      ? (body as { ingredients: unknown }).ingredients
      : undefined;

  if (
    !Array.isArray(ingredients) ||
    ingredients.length < 2 ||
    !ingredients.every((item) => typeof item === "string")
  ) {
    return NextResponse.json(
      { error: "Servono almeno 2 ingredienti." },
      { status: 400 }
    );
  }

  try {
    const message = await client.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      output_config: {
        format: zodOutputFormat(RecipeSchema),
        effort: "medium",
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Ingredienti disponibili: ${ingredients.join(", ")}.`,
        },
      ],
    });

    if (message.stop_reason === "refusal" || !message.parsed_output) {
      return NextResponse.json(
        { error: "Non sono riuscito a generare la ricetta. Riprova." },
        { status: 502 }
      );
    }

    return NextResponse.json(message.parsed_output);
  } catch (error) {
    console.error("Errore generazione ricetta:", error);
    return NextResponse.json(
      { error: "Non sono riuscito a generare la ricetta. Riprova." },
      { status: 502 }
    );
  }
}
