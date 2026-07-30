"use client";

import { useEffect, useState } from "react";
import type { Recipe } from "./types";

export interface PlannedMeal {
  id: string;
  day: string;
  recipe: Recipe;
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

export function useMealPlan() {
  const [plan, setPlan] = useState<PlannedMeal[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Il caricamento deve avvenire dopo il primo render (non durante) perché
    // localStorage non esiste lato server: leggerlo prima causerebbe un
    // mismatch tra l'HTML renderizzato dal server e quello del client.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setPlan(JSON.parse(raw));
    } catch {
      // localStorage non disponibile o dati corrotti: si parte con un piano vuoto.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    } catch {
      // Storage pieno o non disponibile: il piano resta solo in memoria per questa sessione.
    }
  }, [plan, loaded]);

  function addMeal(day: string, recipe: Recipe) {
    setPlan((prev) => [
      ...prev,
      { id: `${day}-${crypto.randomUUID()}`, day, recipe },
    ]);
  }

  function removeMeal(id: string) {
    setPlan((prev) => prev.filter((meal) => meal.id !== id));
  }

  return { plan, addMeal, removeMeal };
}
