"use client";

import { useCallback, useEffect, useState } from "react";
import { deviceHeaders } from "./deviceId";
import type { PlanDay } from "./planImport";

// Il piano nutrizionale importato: stesso spirito di usePantry.ts, persiste
// su Supabase in modo anonimo per dispositivo (vedi app/api/nutrition-plan/route.ts).
// Un nuovo import sostituisce per intero quello precedente, non lo somma.

const API_URL = "/api/nutrition-plan";

export interface ImportPlanResult {
  recognized: boolean;
  reason: string;
  days: PlanDay[];
}

export function useNutritionPlan() {
  const [days, setDays] = useState<PlanDay[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(API_URL, { headers: deviceHeaders() });
        if (!res.ok) throw new Error("nutrition-plan fetch failed");
        const data = await res.json();
        if (!cancelled) setDays(Array.isArray(data.days) ? data.days : []);
      } catch {
        // Supabase non raggiungibile o non configurato: nessun piano per
        // questa sessione, niente di più grave (nessun fallback locale,
        // a differenza della dispensa: il piano arriva sempre da un import
        // esplicito dell'utente, non c'è uno stato "prima di questa migrazione"
        // da recuperare).
        if (!cancelled) setDays([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const importPlan = useCallback(
    async (file: string, mediaType: string): Promise<ImportPlanResult> => {
      setImporting(true);
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: deviceHeaders(true),
          body: JSON.stringify({ file, mediaType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Errore sconosciuto.");

        const result = data as ImportPlanResult;
        if (result.recognized) setDays(result.days);
        return result;
      } finally {
        setImporting(false);
      }
    },
    []
  );

  const clear = useCallback(() => {
    setDays([]);
    void fetch(API_URL, { method: "DELETE", headers: deviceHeaders() }).catch(
      () => {}
    );
  }, []);

  return { days, loaded, importing, importPlan, clear };
}
