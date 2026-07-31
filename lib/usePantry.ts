"use client";

import { useCallback, useEffect, useState } from "react";
import { deviceHeaders } from "./deviceId";

// La dispensa: l'elenco di cosa hai in casa, che resta tra una visita e
// l'altra.
//
// Perché è il pezzo più importante dell'app: senza, ogni volta riparti da zero
// e ridigiti gli stessi ingredienti — motivo numero uno per cui nessuno torna
// una seconda volta. Con la dispensa, riaprire Blendit costa zero fatica.
//
// Dove vivono i dati: su Supabase (vedi app/api/pantry/route.ts), non su
// questo dispositivo soltanto — sopravvive alla cancellazione dei dati del
// browser. Nessun account però: l'identificatore è un id anonimo per
// dispositivo (lib/deviceId.ts), non un vero login. Se Supabase non risponde
// (non configurato, rete assente), l'app degrada esattamente come si
// comportava prima di questa migrazione: stato valido per la sessione, ma
// non sopravvive a un refresh.

export interface PantryItem {
  name: string;
  addedAt: number;
  /** Se true, l'ingrediente viene usato per la prossima ricetta. */
  selected: boolean;
}

const STORAGE_KEY = "blendit-pantry";
const API_URL = "/api/pantry";

/** Oltre questo numero la dispensa diventa ingestibile da usare a mano. */
const MAX_ITEMS = 60;

/** Confronto tollerante: "Pomodori" e "pomodori " sono lo stesso ingrediente. */
function normalize(name: string): string {
  return name.trim().toLowerCase();
}

function isValidItem(value: unknown): value is PantryItem {
  const item = value as Partial<PantryItem>;
  return (
    typeof item?.name === "string" &&
    typeof item?.addedAt === "number" &&
    typeof item?.selected === "boolean"
  );
}

function readLegacyPantry(): PantryItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidItem) : [];
  } catch {
    return [];
  }
}

/**
 * Migrazione una tantum: se Supabase non ha ancora righe per questo
 * dispositivo ma il vecchio localStorage sì, le invia una volta sola.
 * Idempotente - se fallisce, ritenta al prossimo mount senza duplicare nulla
 * (l'inserimento è deduplicato per nome normalizzato lato server).
 */
async function migrateLegacyPantry(): Promise<PantryItem[] | null> {
  const legacyItems = readLegacyPantry();
  if (legacyItems.length === 0) return null;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: deviceHeaders(true),
    body: JSON.stringify({
      names: legacyItems.map((item) => item.name),
      selected: true,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();

  // Il POST di migrazione segna tutto come selected: true; ripristiniamo qui
  // gli articoli che l'utente aveva disattivato prima della migrazione (di
  // solito nessuno o pochissimi - un ciclo semplice basta).
  const deselected = legacyItems.filter((item) => !item.selected);
  for (const item of deselected) {
    await fetch(API_URL, {
      method: "PATCH",
      headers: deviceHeaders(true),
      body: JSON.stringify({ name: item.name, selected: false }),
    }).catch(() => {});
  }

  window.localStorage.removeItem(STORAGE_KEY);

  if (deselected.length === 0) return data.items;
  // Rispecchia localmente le disattivazioni appena ripristinate, invece di
  // fare un'altra chiamata GET solo per questo.
  const deselectedKeys = new Set(deselected.map((item) => normalize(item.name)));
  return (data.items as PantryItem[]).map((item) =>
    deselectedKeys.has(normalize(item.name)) ? { ...item, selected: false } : item
  );
}

export function usePantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(API_URL, { headers: deviceHeaders() });
        if (!res.ok) throw new Error("pantry fetch failed");
        const data = await res.json();
        let serverItems: PantryItem[] = data.items;

        if (serverItems.length === 0) {
          const migrated = await migrateLegacyPantry();
          if (migrated) serverItems = migrated;
        }

        if (!cancelled) setItems(serverItems);
      } catch {
        // Supabase non raggiungibile o non configurato: degradiamo leggendo
        // il vecchio localStorage, come prima di questa migrazione.
        if (!cancelled) setItems(readLegacyPantry());
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const addMany = useCallback(
    (names: string[], options?: { selected?: boolean }) => {
      const selected = options?.selected ?? true;

      // Ripuliamo e deduplichiamo l'input prima di toccare lo stato.
      const cleaned: string[] = [];
      const seenInInput = new Set<string>();
      for (const rawName of names) {
        const name = rawName.trim();
        if (name.length === 0) continue;
        const key = normalize(name);
        if (seenInInput.has(key)) continue;
        seenInInput.add(key);
        cleaned.push(name);
      }

      // Quanti ingredienti restano fuori per il limite MAX_ITEMS: il
      // chiamante lo usa per avvisare l'utente invece di scartarli in
      // silenzio (vedi RecipeFinder.tsx).
      let droppedCount = 0;

      setItems((prev) => {
        const existingKeys = new Set(prev.map((item) => normalize(item.name)));

        // Gli ingredienti già in dispensa non si duplicano: al massimo si
        // riaccendono per la ricetta in corso.
        const reactivated = prev.map((item) =>
          selected && seenInInput.has(normalize(item.name))
            ? { ...item, selected: true }
            : item
        );

        const candidates = cleaned.filter(
          (name) => !existingKeys.has(normalize(name))
        );
        const additions = candidates
          .slice(0, Math.max(0, MAX_ITEMS - prev.length))
          .map((name) => ({ name, addedAt: Date.now(), selected }));
        droppedCount = candidates.length - additions.length;

        // Nota: questa funzione deve restare "pura" (nessun effetto
        // collaterale). React la può eseguire due volte in sviluppo per
        // scovare i bug: registrare un evento qui dentro lo conterebbe due
        // volte e falserebbe le metriche. Per questo il track() sta fuori.
        return additions.length === 0 ? reactivated : [...reactivated, ...additions];
      });

      // Sincronizza con Supabase in background: se fallisce, la dispensa
      // resta valida per questa sessione ma non sopravvive a un refresh,
      // stesso spirito del catch su localStorage pieno di prima.
      if (cleaned.length > 0) {
        void fetch(API_URL, {
          method: "POST",
          headers: deviceHeaders(true),
          body: JSON.stringify({ names: cleaned, selected }),
        }).catch(() => {});
      }

      return droppedCount;
    },
    []
  );

  const add = useCallback(
    (name: string) => addMany([name]),
    [addMany]
  );

  const remove = useCallback((name: string) => {
    const key = normalize(name);
    setItems((prev) => prev.filter((item) => normalize(item.name) !== key));
    void fetch(`${API_URL}?name=${encodeURIComponent(name)}`, {
      method: "DELETE",
      headers: deviceHeaders(),
    }).catch(() => {});
  }, []);

  /** Attiva/disattiva un ingrediente per la prossima ricetta senza cancellarlo. */
  const toggle = useCallback((name: string) => {
    const key = normalize(name);
    let nextSelected: boolean | null = null;
    setItems((prev) =>
      prev.map((item) => {
        if (normalize(item.name) !== key) return item;
        nextSelected = !item.selected;
        return { ...item, selected: nextSelected };
      })
    );
    if (nextSelected !== null) {
      void fetch(API_URL, {
        method: "PATCH",
        headers: deviceHeaders(true),
        body: JSON.stringify({ name, selected: nextSelected }),
      }).catch(() => {});
    }
  }, []);

  const setAllSelected = useCallback((selected: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected })));
    void fetch(API_URL, {
      method: "PATCH",
      headers: deviceHeaders(true),
      body: JSON.stringify({ all: true, selected }),
    }).catch(() => {});
  }, []);

  /**
   * Disattiva (selected: false) un elenco di ingredienti senza cancellarli
   * dalla dispensa - usato quando una ricetta viene aggiunta al piano, per
   * "consumare" gli ingredienti usati senza doverli ridigitare in futuro.
   * Stesso spirito di toggle()/setAllSelected(), ma su un sottoinsieme di nomi.
   */
  const deselectMany = useCallback((names: string[]) => {
    if (names.length === 0) return;
    const keys = new Set(names.map(normalize));
    setItems((prev) =>
      prev.map((item) =>
        keys.has(normalize(item.name)) ? { ...item, selected: false } : item
      )
    );
    void fetch(API_URL, {
      method: "PATCH",
      headers: deviceHeaders(true),
      body: JSON.stringify({ names, selected: false }),
    }).catch(() => {});
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    void fetch(API_URL, { method: "DELETE", headers: deviceHeaders() }).catch(
      () => {}
    );
  }, []);

  const selectedNames = items
    .filter((item) => item.selected)
    .map((item) => item.name);

  return {
    items,
    loaded,
    selectedNames,
    add,
    addMany,
    remove,
    toggle,
    setAllSelected,
    deselectMany,
    clear,
  };
}
