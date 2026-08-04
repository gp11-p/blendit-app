import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getOwnerId } from "@/lib/ownerId";
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
  type PlanDay,
} from "@/lib/planImport";

// Persistenza vera del piano nutrizionale (vedi lib/useNutritionPlan.ts per
// il consumatore lato client, supabase/schema.sql per la tabella
// `nutrition_plan`). Una riga per dispositivo: un nuovo import sostituisce
// per intero il piano precedente, non lo somma.
//
// Ogni query DEVE filtrare per owner_id: e' l'unico controllo di accesso che
// esiste (RLS senza policy blocca tutto tranne la service-role key).

const client = new Anthropic();

const IMPORT_LIMIT = 8;
const IMPORT_WINDOW_MS = 10 * 60 * 1000;
const READ_LIMIT = 60;
const READ_WINDOW_MS = 10 * 60 * 1000;

function guard(request: Request, limit: number, windowMs: number, scope: string) {
  const limitResult = rateLimit(getClientKey(request, scope), limit, windowMs);
  if (!limitResult.allowed) {
    return {
      error: tooManyRequestsResponse(
        limitResult,
        "Troppe richieste in poco tempo. Riprova tra qualche minuto."
      ),
    };
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return {
      error: NextResponse.json(
        { error: "Supabase non configurato sul server." },
        { status: 500 }
      ),
    };
  }

  const ownerId = getOwnerId(request);
  if (!ownerId) {
    return {
      error: NextResponse.json(
        { error: "Identificativo dispositivo mancante o non valido." },
        { status: 400 }
      ),
    };
  }

  return { supabase, ownerId };
}

export async function GET(request: Request) {
  const guarded = guard(request, READ_LIMIT, READ_WINDOW_MS, "nutrition-plan");
  if ("error" in guarded) return guarded.error;
  const { supabase, ownerId } = guarded;

  const { data, error } = await supabase
    .from("nutrition_plan")
    .select("days, imported_at")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Non sono riuscito a leggere il piano." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    days: (data?.days as PlanDay[] | undefined) ?? [],
    importedAt: data?.imported_at ?? null,
  });
}

export async function POST(request: Request) {
  const guarded = guard(request, IMPORT_LIMIT, IMPORT_WINDOW_MS, "nutrition-plan-import");
  if ("error" in guarded) return guarded.error;
  const { supabase, ownerId } = guarded;

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

  let parsedOutput;
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
    parsedOutput = message.parsed_output;
  } catch (error) {
    console.error("Errore import piano nutrizionale:", error);
    return NextResponse.json(
      { error: "Non sono riuscito a leggere il file. Riprova." },
      { status: 502 }
    );
  }

  if (!parsedOutput.recognized) {
    // Non salviamo niente: un piano non riconosciuto non deve sostituire
    // quello (eventualmente) già salvato.
    return NextResponse.json(parsedOutput);
  }

  const { error: upsertError } = await supabase.from("nutrition_plan").upsert({
    owner_id: ownerId,
    days: parsedOutput.days,
    imported_at: new Date().toISOString(),
  });

  if (upsertError) {
    return NextResponse.json(
      { error: "Il piano è stato letto ma non sono riuscito a salvarlo. Riprova." },
      { status: 500 }
    );
  }

  return NextResponse.json(parsedOutput);
}

export async function DELETE(request: Request) {
  const guarded = guard(request, READ_LIMIT, READ_WINDOW_MS, "nutrition-plan");
  if ("error" in guarded) return guarded.error;
  const { supabase, ownerId } = guarded;

  const { error } = await supabase
    .from("nutrition_plan")
    .delete()
    .eq("owner_id", ownerId);

  if (error) {
    return NextResponse.json(
      { error: "Non sono riuscito a cancellare il piano." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
