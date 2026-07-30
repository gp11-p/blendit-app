"use client";

import { useCallback, useEffect, useState } from "react";

// La dispensa: l'elenco di cosa hai in casa, che resta tra una visita e
// l'altra.
//
// Perché è il pezzo più importante dell'app: senza, ogni volta riparti da zero
// e ridigiti gli stessi ingredienti — motivo numero uno per cui nessuno torna
// una seconda volta. Con la dispensa, riaprire Blendit costa zero fatica.
//
// Dove vivono i dati: solo su questo dispositivo (localStorage). Nessun
// account, nessun server, nessun profilo. È una scelta deliberata: costa
// zero, non ci sono obblighi GDPR pesanti, e "i tuoi dati restano sul tuo
// telefono" è una posizione che i concorrenti grandi non possono occupare.
// Il limite è che la dispensa non si sincronizza tra telefono e computer.

export interface PantryItem {
  name: string;
  addedAt: number;
  /** Se true, l'ingrediente viene usato per la prossima ricetta. */
  selected: boolean;
}

const STORAGE_KEY = "blendit-pantry";

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

export function usePantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Come in useMealPlan: si legge dopo il primo render, non durante, perché
    // localStorage non esiste sul server e leggerlo prima causerebbe un
    // mismatch tra l'HTML del server e quello del client.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(parsed.filter(isValidItem));
        }
      }
    } catch {
      // Dati corrotti o storage non disponibile: si parte da una dispensa vuota.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage pieno: la dispensa resta valida per questa sessione.
    }
  }, [items, loaded]);

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
  }, []);

  /** Attiva/disattiva un ingrediente per la prossima ricetta senza cancellarlo. */
  const toggle = useCallback((name: string) => {
    const key = normalize(name);
    setItems((prev) =>
      prev.map((item) =>
        normalize(item.name) === key
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  }, []);

  const setAllSelected = useCallback((selected: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected })));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
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
    clear,
  };
}
