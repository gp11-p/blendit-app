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

// Stesso schema di Recipe (lib/types.ts) e di app/api/recipe/route.ts: così
// RecipeCard, modalità cucina, piano pasti e lista della spesa funzionano
// già su questa ricetta senza nessuna modifica, esattamente come su una
// generata liberamente.
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

const SYSTEM_PROMPT = `Sei uno chef assistente per l'app Blendit. Il paziente segue un piano nutrizionale scritto dal suo nutrizionista. Devi trasformare il pasto prescritto in una ricetta eseguibile, in italiano.

Differenza importante rispetto a una ricetta libera: qui NON stai inventando un piatto, stai mettendo in pratica alimenti e quantità già decisi dal professionista. Rispettali il più fedelmente possibile.

Regole:
- Realizza il pasto usando gli alimenti prescritti. Per ogni alimento prescritto che il paziente NON ha in dispensa, elencalo in missingIngredients con lo stesso nome del piano (nessun limite artificiale: rifletti la realtà, non inventare una ricetta più corta per accorciare la lista). Prima di segnare un alimento come mancante, controlla se è già coperto da uno degli ingredienti in dispensa anche con un nome leggermente diverso.
- usedQuantities riporta, solo per gli ingredienti disponibili in dispensa che si contano a unità intere (es. uova, zucchine, pomodori) e che questa ricetta usa davvero, quante unità ne consuma: un elenco di {name, quantity}, con lo stesso nome esatto ricevuto in dispensa. Ometti gli ingredienti misurati a peso/volume. Se nessuno si qualifica, restituisci un array vuoto.
- steps contiene i passi in ordine, brevi e chiari.
- time è il tempo totale stimato, es. "25 min".
- calories è una stima realistica delle kcal totali per porzione (numero intero).
- servings è il numero di persone (di solito 1, salvo indicazioni diverse nel pasto prescritto).
- title deve richiamare il pasto prescritto, non un nome generico.`;

const PLAN_RECIPE_LIMIT = 15;
const PLAN_RECIPE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const limit = rateLimit(
    getClientKey(request, "plan-recipe"),
    PLAN_RECIPE_LIMIT,
    PLAN_RECIPE_WINDOW_MS
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

  const bodyObject = (body ?? {}) as Record<string, unknown>;
  const mealName = bodyObject.mealName;
  const mealItems = bodyObject.mealItems;
  const pantryItems = bodyObject.pantryItems;

  if (typeof mealName !== "string" || mealName.trim().length === 0) {
    return NextResponse.json(
      { error: "Manca il nome del pasto." },
      { status: 400 }
    );
  }
  if (
    !Array.isArray(mealItems) ||
    mealItems.length === 0 ||
    !mealItems.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).food === "string" &&
        typeof (item as Record<string, unknown>).quantity === "string"
    )
  ) {
    return NextResponse.json(
      { error: "Mancano gli alimenti del pasto." },
      { status: 400 }
    );
  }
  if (
    !Array.isArray(pantryItems) ||
    !pantryItems.every((item) => typeof item === "string")
  ) {
    return NextResponse.json(
      { error: "Elenco della dispensa non valido." },
      { status: 400 }
    );
  }

  const items = mealItems as { food: string; quantity: string }[];

  try {
    const message = await client.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      output_config: { format: zodOutputFormat(RecipeSchema), effort: "medium" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Pasto prescritto: ${mealName}.
Alimenti del piano: ${items.map((item) => `${item.food} (${item.quantity})`).join(", ")}.

Dispensa disponibile: ${
            pantryItems.length > 0 ? pantryItems.join(", ") : "(dispensa vuota)"
          }.`,
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
    console.error("Errore generazione ricetta dal piano:", error);
    return NextResponse.json(
      { error: "Non sono riuscito a generare la ricetta. Riprova." },
      { status: 502 }
    );
  }
}
