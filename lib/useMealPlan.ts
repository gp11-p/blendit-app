"use client";

import { useCallback, useEffect, useState } from "react";
import { deviceHeaders } from "./deviceId";
import type { Recipe } from "./types";

// Il piano pasti settimanale. Dove vivono i dati: su Supabase (vedi
// app/api/meal-plan/route.ts), non solo su questo dispositivo - vedi
// lib/usePantry.ts per il ragionamento completo su persistenza/migrazione/
// degrado, identico qui.

export const MEAL_TYPES = ["Pranzo", "Cena"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export interface PlannedMeal {
  id: string;
  day: string;
  recipe: Recipe;
  /** Assente sulle righe salvate prima dell'introduzione di questo campo. */
  mealType?: MealType;
}

export const DAYS = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];

const STORAGE_KEY = "blendit-meal-plan";
const API_URL = "/api/meal-plan";

function isValidPlannedMeal(value: unknown): value is PlannedMeal {
  const meal = value as Partial<PlannedMeal>;
  return (
    typeof meal?.id === "string" &&
    typeof meal?.day === "string" &&
    typeof meal?.recipe === "object" &&
    meal.recipe !== null
  );
}

function readLegacyPlan(): PlannedMeal[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidPlannedMeal) : [];
  } catch {
    return [];
  }
}

/** Migrazione una tantum, stesso spirito di lib/usePantry.ts. */
async function migrateLegacyPlan(): Promise<PlannedMeal[] | null> {
  const legacyMeals = readLegacyPlan();
  if (legacyMeals.length === 0) return null;

  for (const meal of legacyMeals) {
    const ok = await fetch(API_URL, {
      method: "POST",
      headers: deviceHeaders(true),
      body: JSON.stringify(meal),
    })
      .then((res) => res.ok)
      .catch(() => false);
    if (!ok) return null; // riprova tutto al prossimo mount, niente di parziale
  }

  window.localStorage.removeItem(STORAGE_KEY);
  return legacyMeals;
}

export function useMealPlan() {
  const [plan, setPlan] = useState<PlannedMeal[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(API_URL, { headers: deviceHeaders() });
        if (!res.ok) throw new Error("meal plan fetch failed");
        const data = await res.json();
        let serverPlan: PlannedMeal[] = data.plan;

        if (serverPlan.length === 0) {
          const migrated = await migrateLegacyPlan();
          if (migrated) serverPlan = migrated;
        }

        if (!cancelled) setPlan(serverPlan);
      } catch {
        if (!cancelled) setPlan(readLegacyPlan());
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const addMeal = useCallback(
    (day: string, recipe: Recipe, mealType: MealType) => {
      const meal: PlannedMeal = {
        id: `${day}-${crypto.randomUUID()}`,
        day,
        recipe,
        mealType,
      };
      setPlan((prev) => [...prev, meal]);
      void fetch(API_URL, {
        method: "POST",
        headers: deviceHeaders(true),
        body: JSON.stringify(meal),
      }).catch(() => {});
    },
    []
  );

  const removeMeal = useCallback((id: string) => {
    setPlan((prev) => prev.filter((meal) => meal.id !== id));
    void fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: deviceHeaders(),
    }).catch(() => {});
  }, []);

  return { plan, loaded, addMeal, removeMeal };
}
