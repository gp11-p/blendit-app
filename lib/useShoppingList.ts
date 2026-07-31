"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deviceHeaders } from "./deviceId";
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
//
// Dove vivono i dati: su Supabase (vedi app/api/shopping-checked/route.ts),
// non solo su questo dispositivo - vedi lib/usePantry.ts per il ragionamento
// completo su persistenza/migrazione/degrado, identico qui.

const STORAGE_KEY = "blendit-shopping-checked";
const API_URL = "/api/shopping-checked";

export interface ShoppingItem {
  name: string;
  checked: boolean;
  /** Titoli delle ricette che richiedono questo ingrediente. */
  forRecipes: string[];
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

function readLegacyChecked(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((k): k is string => typeof k === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Migrazione una tantum, stesso spirito di lib/usePantry.ts. Qui "niente da
 * migrare" e "un array vuoto legittimo" sono la stessa cosa: non c'è nulla da
 * perdere in entrambi i casi.
 */
async function migrateLegacyChecked(): Promise<string[] | null> {
  const legacyKeys = readLegacyChecked();
  if (legacyKeys.length === 0) return null;

  const res = await fetch(API_URL, {
    method: "PATCH",
    headers: deviceHeaders(true),
    body: JSON.stringify({ checkedKeys: legacyKeys }),
  });
  if (!res.ok) return null;

  window.localStorage.removeItem(STORAGE_KEY);
  return legacyKeys;
}

export function useShoppingList(plan: PlannedMeal[]) {
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(API_URL, { headers: deviceHeaders() });
        if (!res.ok) throw new Error("shopping-checked fetch failed");
        const data = await res.json();
        let serverChecked: string[] | null = data.checkedKeys;

        if (serverChecked === null) {
          serverChecked = (await migrateLegacyChecked()) ?? [];
        }

        if (!cancelled) setCheckedKeys(serverChecked);
      } catch {
        if (!cancelled) setCheckedKeys(readLegacyChecked());
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sincronizza ogni cambio (spunte, azzeramento, la potatura sotto) verso
  // Supabase. Fire-and-forget: se fallisce, le spunte restano valide per
  // questa sessione ma non sopravvivono a un refresh.
  useEffect(() => {
    if (!loaded) return;
    void fetch(API_URL, {
      method: "PATCH",
      headers: deviceHeaders(true),
      body: JSON.stringify({ checkedKeys }),
    }).catch(() => {});
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
