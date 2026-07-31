import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getOwnerId } from "@/lib/ownerId";
import {
  getClientKey,
  rateLimit,
  tooManyRequestsResponse,
} from "@/lib/rateLimit";
import type { PantryItem } from "@/lib/usePantry";

// Persistenza vera della dispensa (vedi lib/usePantry.ts per il consumatore
// lato client, e supabase/schema.sql per la tabella `pantry_items`).
//
// Ogni query qui sotto DEVE filtrare per owner_id: e' l'unico controllo di
// accesso che esiste (RLS sulla tabella non ha policy, quindi blocca tutto
// tranne la service-role key usata da questo file - vedi lib/supabaseServer.ts).

// Stesso numero di lib/usePantry.ts: oltre questa soglia la dispensa diventa
// ingestibile da usare a mano. Tenuto in sync a mano nei due file - e' un
// singolo numero, non vale la pena condividerlo tra client e server per questo.
const MAX_ITEMS = 60;

const PANTRY_LIMIT = 60;
const PANTRY_WINDOW_MS = 10 * 60 * 1000;

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

interface PantryRow {
  name: string;
  added_at: string;
  selected: boolean;
}

function toPantryItem(row: PantryRow): PantryItem {
  return {
    name: row.name,
    addedAt: new Date(row.added_at).getTime(),
    selected: row.selected,
  };
}

function guard(request: Request) {
  const limit = rateLimit(
    getClientKey(request, "pantry"),
    PANTRY_LIMIT,
    PANTRY_WINDOW_MS
  );
  if (!limit.allowed) {
    return {
      error: tooManyRequestsResponse(
        limit,
        "Troppe richieste alla dispensa in poco tempo. Riprova tra qualche minuto."
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
  const guarded = guard(request);
  if ("error" in guarded) return guarded.error;
  const { supabase, ownerId } = guarded;

  const { data, error } = await supabase
    .from("pantry_items")
    .select("name, added_at, selected")
    .eq("owner_id", ownerId);

  if (error) {
    return NextResponse.json(
      { error: "Non sono riuscito a leggere la dispensa." },
      { status: 500 }
    );
  }

  return NextResponse.json({ items: data.map(toPantryItem) });
}

export async function POST(request: Request) {
  const guarded = guard(request);
  if ("error" in guarded) return guarded.error;
  const { supabase, ownerId } = guarded;

  const body = await request.json();
  const names: unknown = body?.names;
  const selected: boolean = body?.selected ?? true;

  if (!Array.isArray(names) || names.some((n) => typeof n !== "string")) {
    return NextResponse.json(
      { error: "Elenco ingredienti non valido." },
      { status: 400 }
    );
  }

  // Ripuliamo e deduplichiamo l'input, stessa logica di lib/usePantry.ts.
  const cleaned: string[] = [];
  const seenInInput = new Set<string>();
  for (const rawName of names as string[]) {
    const name = rawName.trim();
    if (name.length === 0) continue;
    const key = normalize(name);
    if (seenInInput.has(key)) continue;
    seenInInput.add(key);
    cleaned.push(name);
  }

  const { data: existingRows, error: readError } = await supabase
    .from("pantry_items")
    .select("normalized_name")
    .eq("owner_id", ownerId);

  if (readError) {
    return NextResponse.json(
      { error: "Non sono riuscito a leggere la dispensa." },
      { status: 500 }
    );
  }

  const existingKeys = new Set(existingRows.map((r) => r.normalized_name));

  const reactivatedKeys = cleaned
    .map(normalize)
    .filter((key) => selected && existingKeys.has(key));

  if (reactivatedKeys.length > 0) {
    const { error: updateError } = await supabase
      .from("pantry_items")
      .update({ selected: true })
      .eq("owner_id", ownerId)
      .in("normalized_name", reactivatedKeys);
    if (updateError) {
      return NextResponse.json(
        { error: "Non sono riuscito ad aggiornare la dispensa." },
        { status: 500 }
      );
    }
  }

  const candidates = cleaned.filter((name) => !existingKeys.has(normalize(name)));
  const additions = candidates.slice(
    0,
    Math.max(0, MAX_ITEMS - existingKeys.size)
  );
  const droppedCount = candidates.length - additions.length;

  if (additions.length > 0) {
    const { error: insertError } = await supabase.from("pantry_items").insert(
      additions.map((name) => ({
        owner_id: ownerId,
        normalized_name: normalize(name),
        name,
        selected,
      }))
    );
    if (insertError) {
      return NextResponse.json(
        { error: "Non sono riuscito a salvare i nuovi ingredienti." },
        { status: 500 }
      );
    }
  }

  const { data: finalRows, error: finalError } = await supabase
    .from("pantry_items")
    .select("name, added_at, selected")
    .eq("owner_id", ownerId);

  if (finalError) {
    return NextResponse.json(
      { error: "Non sono riuscito a leggere la dispensa aggiornata." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    items: finalRows.map(toPantryItem),
    droppedCount,
  });
}

export async function PATCH(request: Request) {
  const guarded = guard(request);
  if ("error" in guarded) return guarded.error;
  const { supabase, ownerId } = guarded;

  const body = await request.json();
  const selected: unknown = body?.selected;

  if (typeof selected !== "boolean") {
    return NextResponse.json(
      { error: "Valore 'selected' non valido." },
      { status: 400 }
    );
  }

  let query = supabase
    .from("pantry_items")
    .update({ selected })
    .eq("owner_id", ownerId);

  if (body?.all !== true) {
    const name: unknown = body?.name;
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome ingrediente mancante." },
        { status: 400 }
      );
    }
    query = query.eq("normalized_name", normalize(name));
  }

  const { error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Non sono riuscito ad aggiornare la dispensa." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const guarded = guard(request);
  if ("error" in guarded) return guarded.error;
  const { supabase, ownerId } = guarded;

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  let query = supabase.from("pantry_items").delete().eq("owner_id", ownerId);
  if (name) {
    query = query.eq("normalized_name", normalize(name));
  }

  const { error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Non sono riuscito a togliere l'ingrediente." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
