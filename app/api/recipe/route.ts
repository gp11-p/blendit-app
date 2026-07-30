import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import { DIET_OPTIONS, DISH_TYPE_OPTIONS, TIME_OPTIONS } from "@/lib/preferences";
import type { Preferences } from "@/lib/types";

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

const KNOWN_TIMES = TIME_OPTIONS.map((option) => option.value).filter(
  (value): value is Exclude<Preferences["maxTime"], null> => value !== null
);
const KNOWN_DIETS: readonly string[] = DIET_OPTIONS;
const KNOWN_DISH_TYPES = DISH_TYPE_OPTIONS.map((option) => option.value);

function sanitizePreferences(input: unknown): Preferences {
  const raw = (input ?? {}) as Record<string, unknown>;

  const maxTime =
    typeof raw.maxTime === "string" &&
    (KNOWN_TIMES as string[]).includes(raw.maxTime)
      ? (raw.maxTime as Preferences["maxTime"])
      : null;

  const diets = Array.isArray(raw.diets)
    ? raw.diets.filter(
        (item): item is string =>
          typeof item === "string" && KNOWN_DIETS.includes(item)
      )
    : [];

  const dishType =
    typeof raw.dishType === "string" &&
    (KNOWN_DISH_TYPES as string[]).includes(raw.dishType)
      ? (raw.dishType as Preferences["dishType"])
      : "a caso";

  return { maxTime, diets, dishType };
}

function buildPreferencesInstructions(preferences: Preferences): string {
  const lines: string[] = [];

  if (preferences.maxTime) {
    lines.push(
      `- Il tempo totale di preparazione non deve superare ${preferences.maxTime} minuti.`
    );
  }
  if (preferences.diets.length > 0) {
    lines.push(
      `- La ricetta deve rispettare queste esigenze dietetiche: ${preferences.diets.join(", ")}.`
    );
  }
  if (preferences.dishType !== "a caso") {
    lines.push(`- Il tipo di piatto richiesto è: ${preferences.dishType}.`);
  }

  if (lines.length === 0) return "";

  return `\n\nPreferenze dell'utente per questa ricetta:\n${lines.join("\n")}`;
}

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

  const bodyObject = typeof body === "object" && body !== null ? body : {};
  const ingredients =
    "ingredients" in bodyObject
      ? (bodyObject as { ingredients: unknown }).ingredients
      : undefined;
  const preferences = sanitizePreferences(
    "preferences" in bodyObject
      ? (bodyObject as { preferences: unknown }).preferences
      : undefined
  );

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
      system: SYSTEM_PROMPT + buildPreferencesInstructions(preferences),
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
