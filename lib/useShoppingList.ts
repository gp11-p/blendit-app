"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PlannedMeal } from "./useMealPlan";

// La lista della spesa: unisce gli ingredienti mancanti di tutte le ricette
// che hai messo nel piano settimanale.
//
// Perché esiste: il piano pasti da solo era un vicolo cieco — lo compilavi e
// poi non succedeva niente. La lista della spesa è il pezzo che trasforma
// Blendit da "generatore di ricette" (si usa due volte e si dimentica) a
// strumento con un ritmo settimanale: pianifico → compro → cucino →
// ripianifico.
//
// Quando spunti un articolo, quello finisce in dispensa: è così che il
// cerchio si chiude senza che l'utente debba ridigitare nulla.

const STORAGE_KEY = "blendit-shopping-checked";

export interface ShoppingItem {
  name: string;
  checked: boolean;
  /** Titoli delle ricette che richiedono questo ingrediente. */
  forRecipes: string[];
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export function useShoppingList(plan: PlannedMeal[]) {
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCheckedKeys(parsed.filter((k): k is string => typeof k === "string"));
        }
      }
    } catch {
      // Dati corrotti: si riparte con nessun articolo spuntato.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedKeys));
    } catch {
      // Storage pieno: le spunte restano valide per questa sessione.
    }
  }, [checkedKeys, loaded]);

  // Se un ingrediente spuntato non è più richiesto da nessuna ricetta nel
  // piano (la ricetta è stata rimossa), dimentichiamo la spunta. Altrimenti
  // resterebbe "già comprato" per sempre, e riapparirebbe segnato come tale
  // anche mesi dopo in una ricetta completamente diversa che chiede lo
  // stesso ingrediente.
  useEffect(() => {
    if (!loaded) return;
    const relevantKeys = new Set(
      plan.flatMap((meal) =>
        meal.recipe.missingIngredients
          .map((name) => normalize(name))
          .filter((name) => name.length > 0)
      )
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckedKeys((prev) => {
      const next = prev.filter((key) => relevantKeys.has(key));
      return next.length === prev.length ? prev : next;
    });
  }, [plan, loaded]);

  const items = useMemo<ShoppingItem[]>(() => {
    // Raggruppiamo per nome normalizzato, così "Mozzarella" e "mozzarella"
    // non compaiono due volte, ma teniamo la prima grafia incontrata.
    const byKey = new Map<string, ShoppingItem>();

    for (const meal of plan) {
      for (const rawName of meal.recipe.missingIngredients) {
        const name = rawName.trim();
        if (name.length === 0) continue;

        const key = normalize(name);
        const existing = byKey.get(key);

        if (existing) {
          if (!existing.forRecipes.includes(meal.recipe.title)) {
            existing.forRecipes.push(meal.recipe.title);
          }
        } else {
          byKey.set(key, {
            name,
            checked: checkedKeys.includes(key),
            forRecipes: [meal.recipe.title],
          });
        }
      }
    }

    // Prima le cose ancora da comprare: la lista resta utile mentre la usi
    // dentro al supermercato.
    return [...byKey.values()].sort((a, b) =>
      a.checked === b.checked ? a.name.localeCompare(b.name) : a.checked ? 1 : -1
    );
  }, [plan, checkedKeys]);

  const toggle = useCallback((name: string) => {
    const key = normalize(name);
    setCheckedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const clearChecked = useCallback(() => {
    setCheckedKeys([]);
  }, []);

  const remaining = items.filter((item) => !item.checked).length;

  /** Testo pronto da incollare in WhatsApp o nelle note del telefono. */
  const asText = useMemo(() => {
    if (items.length === 0) return "";
    const lines = items.map(
      (item) => `${item.checked ? "✅" : "▫️"} ${item.name}`
    );
    return `Lista della spesa — Blendit\n\n${lines.join("\n")}`;
  }, [items]);

  return { items, remaining, toggle, clearChecked, asText };
}
