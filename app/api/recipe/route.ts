import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getClientKey,
  rateLimit,
  tooManyRequestsResponse,
} from "@/lib/rateLimit";
import {
  CALORIE_OPTIONS,
  DIET_OPTIONS,
  DISH_TYPE_OPTIONS,
  SERVINGS_OPTIONS,
  TIME_OPTIONS,
} from "@/lib/preferences";
import type { Preferences } from "@/lib/types";

const client = new Anthropic();

const NamedQuantitySchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
});

const RecipeSchema = z.object({
  title: z.string(),
  time: z.string(),
  difficulty: z.enum(["Facile", "Media", "Difficile"]),
  calories: z.number(),
  servings: z.number(),
  missingIngredients: z.array(z.string()),
  usedQuantities: z.array(NamedQuantitySchema),
  steps: z.array(z.string()),
});

const SYSTEM_PROMPT = `Sei uno chef assistente per l'app Blendit. Dato un elenco di ingredienti disponibili, proponi UNA ricetta realizzabile con quello che l'utente ha, in italiano.

Regole:
- Se manca qualcosa di essenziale per completare il piatto, elencalo in missingIngredients (massimo 2 elementi). Se non manca nulla, restituisci un array vuoto. Prima di segnare un ingrediente come mancante, controlla se è già coperto da uno degli ingredienti disponibili anche con un nome leggermente diverso (es. "olio" è coperto da "olio d'oliva"; "sale" e "pepe" sono coperti da "sale e pepe"): in quel caso non è mancante.
- usedQuantities riporta, solo per gli ingredienti disponibili che si contano a unità intere (es. uova, zucchine, pomodori, singoli frutti o verdure) e che questa ricetta usa davvero, quante unità ne consuma: un elenco di {name, quantity}, con lo stesso nome esatto ricevuto in "Ingredienti disponibili". Ometti gli ingredienti misurati a peso/volume o non numerabili (farina, olio, latte, riso, sale, zucchero...) e quelli di cui non sei ragionevolmente sicuro. Se nessuno si qualifica, restituisci un array vuoto: è un risultato normale, non un errore.
- steps contiene i passi in ordine, uno per elemento, brevi e chiari, con le quantità di ingredienti adeguate al numero di porzioni.
- time è il tempo totale stimato, es. "25 min".
- calories è una stima realistica delle kcal totali per porzione (numero intero, es. 450).
- servings è il numero di persone per cui è dosata la ricetta (numero intero). Se l'utente non specifica una preferenza, scegli tu un valore ragionevole (di solito 2) e riportalo comunque in questo campo.`;

const KNOWN_TIMES = TIME_OPTIONS.map((option) => option.value).filter(
  (value): value is Exclude<Preferences["maxTime"], null> => value !== null
);
const KNOWN_DIETS: readonly string[] = DIET_OPTIONS;
const KNOWN_DISH_TYPES = DISH_TYPE_OPTIONS.map((option) => option.value);
const KNOWN_SERVINGS = SERVINGS_OPTIONS.map((option) => option.value).filter(
  (value): value is Exclude<Preferences["servings"], null> => value !== null
);
const KNOWN_CALORIES = CALORIE_OPTIONS.map((option) => option.value).filter(
  (value): value is Exclude<Preferences["maxCalories"], null> => value !== null
);

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

  const servings =
    typeof raw.servings === "number" &&
    (KNOWN_SERVINGS as number[]).includes(raw.servings)
      ? (raw.servings as Preferences["servings"])
      : null;

  const maxCalories =
    typeof raw.maxCalories === "number" &&
    (KNOWN_CALORIES as number[]).includes(raw.maxCalories)
      ? (raw.maxCalories as Preferences["maxCalories"])
      : null;

  return { maxTime, diets, dishType, servings, maxCalories };
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
  if (preferences.servings) {
    lines.push(
      `- Dosa la ricetta esattamente per ${preferences.servings} person${preferences.servings === 1 ? "a" : "e"} e riporta questo numero nel campo servings.`
    );
  }
  if (preferences.maxCalories) {
    lines.push(
      `- Le kcal totali per porzione non devono superare ${preferences.maxCalories} kcal.`
    );
  }

  if (lines.length === 0) return "";

  return `\n\nPreferenze dell'utente per questa ricetta:\n${lines.join("\n")}`;
}

function buildCravingInstruction(craving: string): string {
  if (craving.length === 0) return "";

  return `\n\nL'utente in questo momento ha voglia di: "${craving}". Tienine conto nella scelta del piatto, ma resta comunque realizzabile con gli ingredienti disponibili che ti verranno indicati: se sono in conflitto, gli ingredienti disponibili restano il vincolo principale.`;
}

function buildVariationInstruction(previousTitles: string[]): string {
  if (previousTitles.length === 0) return "";

  return `\n\nNon riproporre ricette già suggerite in questa sessione (l'utente ha chiesto un'alternativa): ${previousTitles.join(", ")}. Proponi qualcosa di diverso.`;
}

// Ogni chiamata a questo endpoint costa soldi veri (circa 1 centesimo di
// token Anthropic). Senza un limite, chiunque scopra l'URL può svuotare il
// budget con uno script. 15 ricette ogni 10 minuti è molto più di quanto
// serva a una persona che cucina davvero.
const RECIPE_LIMIT = 15;
const RECIPE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const limit = rateLimit(
    getClientKey(request, "recipe"),
    RECIPE_LIMIT,
    RECIPE_WINDOW_MS
  );
  if (!limit.allowed) {
    return tooManyRequestsResponse(
      limit,
      "Hai generato tante ricette in poco tempo. Riprova tra qualche minuto."
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
  const previousTitlesRaw =
    "previousTitles" in bodyObject
      ? (bodyObject as { previousTitles: unknown }).previousTitles
      : undefined;
  const previousTitles = Array.isArray(previousTitlesRaw)
    ? previousTitlesRaw
        .filter((item): item is string => typeof item === "string")
        .slice(-5)
    : [];
  const cravingRaw =
    "craving" in bodyObject
      ? (bodyObject as { craving: unknown }).craving
      : undefined;
  const craving = typeof cravingRaw === "string" ? cravingRaw.trim().slice(0, 120) : "";

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
      system:
        SYSTEM_PROMPT +
        buildPreferencesInstructions(preferences) +
        buildCravingInstruction(craving) +
        buildVariationInstruction(previousTitles),
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
