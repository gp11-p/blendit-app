import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getOwnerId } from "@/lib/ownerId";
import {
  getClientKey,
  rateLimit,
  tooManyRequestsResponse,
} from "@/lib/rateLimit";

// Persistenza vera delle spunte sulla lista della spesa (vedi
// lib/useShoppingList.ts per il consumatore lato client, e
// supabase/schema.sql per la tabella `shopping_checked`).
//
// IMPORTANTE: il GET distingue "nessuna riga ancora" (null) da "riga con
// array vuoto" ([]) - lib/useShoppingList.ts usa proprio questa differenza
// per decidere se far partire la migrazione una tantum dal vecchio
// localStorage. Collassarle nella stessa cosa romperebbe quella logica.

const SHOPPING_LIMIT = 60;
const SHOPPING_WINDOW_MS = 10 * 60 * 1000;

function guard(request: Request) {
  const limit = rateLimit(
    getClientKey(request, "shopping-checked"),
    SHOPPING_LIMIT,
    SHOPPING_WINDOW_MS
  );
  if (!limit.allowed) {
    return {
      error: tooManyRequestsResponse(
        limit,
        "Troppe richieste alla lista della spesa in poco tempo. Riprova tra qualche minuto."
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
    .from("shopping_checked")
    .select("checked_keys")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Non sono riuscito a leggere le spunte salvate." },
      { status: 500 }
    );
  }

  return NextResponse.json({ checkedKeys: data?.checked_keys ?? null });
}

export async function PATCH(request: Request) {
  const guarded = guard(request);
  if ("error" in guarded) return guarded.error;
  const { supabase, ownerId } = guarded;

  const body = await request.json();
  const checkedKeys: unknown = body?.checkedKeys;

  if (
    !Array.isArray(checkedKeys) ||
    checkedKeys.some((k) => typeof k !== "string")
  ) {
    return NextResponse.json(
      { error: "Elenco spunte non valido." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("shopping_checked")
    .upsert(
      { owner_id: ownerId, checked_keys: checkedKeys, updated_at: new Date().toISOString() },
      { onConflict: "owner_id" }
    );

  if (error) {
    return NextResponse.json(
      { error: "Non sono riuscito a salvare le spunte." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const guarded = guard(request);
  if ("error" in guarded) return guarded.error;
  const { supabase, ownerId } = guarded;

  const { error } = await supabase
    .from("shopping_checked")
    .delete()
    .eq("owner_id", ownerId);

  if (error) {
    return NextResponse.json(
      { error: "Non sono riuscito ad azzerare le spunte." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
