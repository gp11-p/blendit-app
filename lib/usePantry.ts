"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deviceHeaders } from "./deviceId";
import type { NamedQuantity } from "./types";

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
  /**
   * Conteggio tracciato per ingredienti numerabili (uova, zucchine...).
   * `null` = non tracciato: si comporta esattamente come prima di questa
   * funzionalità (presenza/assenza, nessun numero).
   */
  quantity: number | null;
}

const STORAGE_KEY = "blendit-pantry";
const API_URL = "/api/pantry";

/** Oltre questo numero la dispensa diventa ingestibile da usare a mano. */
const MAX_ITEMS = 150;

/** Confronto tollerante: "Pomodori" e "pomodori " sono lo stesso ingrediente. */
function normalize(name: string): string {
  return name.trim().toLowerCase();
}

function isValidItem(value: unknown): value is PantryItem {
  const item = value as Partial<PantryItem>;
  return (
    typeof item?.name === "string" &&
    typeof item?.addedAt === "number" &&
    typeof item?.selected === "boolean" &&
    // Le voci scritte prima dell'introduzione di quantity non hanno questo
    // campo affatto: va accettato assente, non solo un numero.
    (item?.quantity === null ||
      item?.quantity === undefined ||
      typeof item?.quantity === "number")
  );
}

function readLegacyPantry(): PantryItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter(isValidItem)
          .map((item) => ({ ...item, quantity: item.quantity ?? null }))
      : [];
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
  // Un timer di sincronizzazione per ingrediente (chiave normalizzata), per
  // il debounce di adjustQuantity più sotto.
  const pendingQuantitySync = useRef(
    new Map<string, ReturnType<typeof setTimeout>>()
  );

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
    (
      names: string[],
      options?: { selected?: boolean; quantities?: NamedQuantity[] }
    ) => {
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

      // Quantità stimate (da foto), usate SOLO per ingredienti nuovi: non
      // deve mai correggere in silenzio la quantità di un ingrediente già
      // in dispensa (magari l'utente l'ha già sistemata a mano).
      const quantityByKey = new Map<string, number>();
      for (const q of options?.quantities ?? []) {
        if (
          q &&
          typeof q.name === "string" &&
          typeof q.quantity === "number" &&
          Number.isFinite(q.quantity) &&
          q.quantity > 0
        ) {
          quantityByKey.set(normalize(q.name), Math.floor(q.quantity));
        }
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
          .map((name) => ({
            name,
            addedAt: Date.now(),
            selected,
            quantity: quantityByKey.get(normalize(name)) ?? null,
          }));
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
          body: JSON.stringify({
            names: cleaned,
            selected,
            quantities: options?.quantities ?? [],
          }),
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
    setItems((prev) =>
      prev.map((item) =>
        // Un ingrediente tracciato a quota zero non va riacceso da "Usa
        // tutto": non ne hai più, offrirlo vanificherebbe il senso della
        // quantità.
        selected && item.quantity === 0 ? item : { ...item, selected }
      )
    );
    void fetch(API_URL, {
      method: "PATCH",
      headers: deviceHeaders(true),
      body: JSON.stringify({ all: true, selected }),
    }).catch(() => {});
  }, []);

  /**
   * Aumenta o diminuisce di 1 la quantità tracciata di un ingrediente (dal
   * chip in dispensa) - se non era ancora tracciato, +1 la fa partire da 1.
   * Il nuovo valore si calcola DENTRO la updater function, leggendo lo stato
   * più recente (non una prop già passata al chip, che potrebbe non essersi
   * ancora aggiornata): così tap rapidi in sequenza non si perdono l'un
   * l'altro - React incatena correttamente ogni updater al risultato del
   * precedente nello stesso aggiornamento, una prop no.
   * A quota zero si spegne da solo (selected: false) ma resta visibile in
   * dispensa (non si cancella).
   */
  const adjustQuantity = useCallback((name: string, delta: number) => {
    const key = normalize(name);
    let nextQuantity: number | null = null;
    setItems((prev) =>
      prev.map((item) => {
        if (normalize(item.name) !== key) return item;
        nextQuantity = Math.max(0, (item.quantity ?? 0) + delta);
        return {
          ...item,
          quantity: nextQuantity,
          selected: nextQuantity === 0 ? false : item.selected,
        };
      })
    );
    if (nextQuantity === null) return;

    // Sincronizziamo Supabase con un piccolo debounce: click rapidi in
    // sequenza manderebbero altrimenti più PATCH indipendenti in volo
    // insieme, e la rete non garantisce che arrivino nello stesso ordine in
    // cui sono partiti - vincerebbe l'ultimo eseguito lato server, non
    // l'ultimo cliccato. Aspettando che i click si fermino ne parte uno
    // solo, con il valore finale.
    const pending = pendingQuantitySync.current;
    const existingTimer = pending.get(key);
    if (existingTimer) clearTimeout(existingTimer);
    const finalQuantity = nextQuantity;
    pending.set(
      key,
      setTimeout(() => {
        pending.delete(key);
        void fetch(API_URL, {
          method: "PATCH",
          headers: deviceHeaders(true),
          body: JSON.stringify({
            quantities: [{ name, quantity: finalQuantity }],
          }),
        }).catch(() => {});
      }, 400)
    );
  }, []);

  /**
   * Chiamata quando una ricetta viene aggiunta al piano: per ogni
   * ingrediente fornito che ha una quantità tracciata E che la ricetta ha
   * riportato di aver usato, decrementa (si spegne da solo solo se arriva a
   * zero - quello è "terminato"). Gli ingredienti NON tracciati (farina,
   * olio, ketchup...) non vengono mai spenti qui, che siano stati usati poco
   * o per niente: senza una quantità non possiamo sapere se sono davvero
   * finiti, e spegnerli comunque costringerebbe a riaccenderli a mano ad ogni
   * ricetta successiva - l'attrito che la dispensa persistente doveva
   * togliere. Restano disponibili finché l'utente non li spegne di persona.
   */
  const applyRecipeUsage = useCallback(
    (names: string[], usedQuantities: NamedQuantity[]) => {
      if (names.length === 0) return;

      const usageByKey = new Map<string, number>();
      for (const entry of Array.isArray(usedQuantities) ? usedQuantities : []) {
        if (
          entry &&
          typeof entry.name === "string" &&
          typeof entry.quantity === "number" &&
          Number.isFinite(entry.quantity) &&
          entry.quantity > 0
        ) {
          usageByKey.set(normalize(entry.name), Math.floor(entry.quantity));
        }
      }
      if (usageByKey.size === 0) return;

      const suppliedKeys = new Set(names.map(normalize));
      const trackedUpdates: { name: string; quantity: number }[] = [];

      for (const item of items) {
        if (item.quantity === null) continue; // non tracciato: mai toccato qui
        const key = normalize(item.name);
        if (!suppliedKeys.has(key)) continue;
        const usage = usageByKey.get(key);
        if (usage === undefined) continue; // non riportato come usato: nessuna modifica

        trackedUpdates.push({
          name: item.name,
          quantity: Math.max(0, item.quantity - usage),
        });
      }

      if (trackedUpdates.length === 0) return;

      const updatesByKey = new Map(
        trackedUpdates.map((u) => [normalize(u.name), u.quantity])
      );
      setItems((prev) =>
        prev.map((item) => {
          const newQuantity = updatesByKey.get(normalize(item.name));
          if (newQuantity === undefined) return item;
          return {
            ...item,
            quantity: newQuantity,
            selected: newQuantity === 0 ? false : item.selected,
          };
        })
      );
      void fetch(API_URL, {
        method: "PATCH",
        headers: deviceHeaders(true),
        body: JSON.stringify({ quantities: trackedUpdates }),
      }).catch(() => {});
    },
    [items]
  );

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
    adjustQuantity,
    applyRecipeUsage,
    clear,
  };
}
