import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getOwnerId } from "@/lib/ownerId";
import {
  getClientKey,
  rateLimit,
  tooManyRequestsResponse,
} from "@/lib/rateLimit";
import type { PlannedMeal } from "@/lib/useMealPlan";
import type { Recipe } from "@/lib/types";

// Persistenza vera del piano pasti (vedi lib/useMealPlan.ts per il
// consumatore lato client, e supabase/schema.sql per la tabella `meal_plan`).

const MEAL_PLAN_LIMIT = 60;
const MEAL_PLAN_WINDOW_MS = 10 * 60 * 1000;

interface MealPlanRow {
  id: string;
  day: string;
  recipe: Recipe;
}

function toPlannedMeal(row: MealPlanRow): PlannedMeal {
  return { id: row.id, day: row.day, recipe: row.recipe };
}

function guard(request: Request) {
  const limit = rateLimit(
    getClientKey(request, "meal-plan"),
    MEAL_PLAN_LIMIT,
    MEAL_PLAN_WINDOW_MS
  );
  if (!limit.allowed) {
    return {
      error: tooManyRequestsResponse(
        limit,
        "Troppe richieste al piano pasti in poco tempo. Riprova tra qualche minuto."
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
    .from("meal_plan")
    .select("id, day, recipe")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Non sono riuscito a leggere il piano pasti." },
      { status: 500 }
    );
  }

  return NextResponse.json({ plan: data.map(toPlannedMeal) });
}

export async function POST(request: Request) {
  const guarded = guard(request);
  if ("error" in guarded) return guarded.error;
  const { supabase, ownerId } = guarded;

  const body = await request.json();
  const id: unknown = body?.id;
  const day: unknown = body?.day;
  const recipe: unknown = body?.recipe;

  if (
    typeof id !== "string" ||
    typeof day !== "string" ||
    typeof recipe !== "object" ||
    recipe === null
  ) {
    return NextResponse.json(
      { error: "Dati del pasto pianificato non validi." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("meal_plan")
    .insert({ id, owner_id: ownerId, day, recipe });

  if (error) {
    return NextResponse.json(
      { error: "Non sono riuscito a salvare il pasto pianificato." },
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
  const id = searchParams.get("id");

  let query = supabase.from("meal_plan").delete().eq("owner_id", ownerId);
  if (id) {
    query = query.eq("id", id);
  }

  const { error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Non sono riuscito a togliere il pasto dal piano." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
