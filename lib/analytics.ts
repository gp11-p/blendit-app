"use client";

import type { TrackedEvent } from "./analytics-events";

// Misurazione anonima, senza cookie e senza account.
//
// Come funziona: il browser genera un ID casuale e lo tiene in localStorage.
// Non è collegato a nessuna identità — è solo un modo per capire se lo stesso
// dispositivo torna. Se l'utente cancella i dati del browser, sparisce.
//
// Perché non usiamo i cookie: senza cookie non serve il banner di consenso, e
// l'app resta legale in UE senza attriti. È anche una posizione difendibile
// verso l'utente ("non ti tracciamo"), che i concorrenti grandi non hanno.

const VISITOR_KEY = "blendit-visitor";

// Se passano più di 30 minuti dall'ultimo evento, consideriamo che sia
// iniziata una nuova visita. È la stessa convenzione usata dagli strumenti
// di analytics tradizionali.
const NEW_VISIT_GAP_MS = 30 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

interface Visitor {
  id: string;
  firstSeen: number;
  lastSeen: number;
  visits: number;
}

function readVisitor(): Visitor | null {
  try {
    const raw = window.localStorage.getItem(VISITOR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Visitor>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.firstSeen !== "number" ||
      typeof parsed.lastSeen !== "number" ||
      typeof parsed.visits !== "number"
    ) {
      return null;
    }
    return parsed as Visitor;
  } catch {
    return null;
  }
}

/**
 * Legge (o crea) il visitatore e aggiorna il conteggio delle visite.
 *
 * Il conteggio lo fa il client, non il server: così anche solo leggendo i log
 * grezzi si vede "visits: 3" e si capisce subito chi sta tornando, senza
 * bisogno di un database che colleghi gli eventi tra loro.
 */
function touchVisitor(): Visitor | null {
  if (typeof window === "undefined") return null;

  const now = Date.now();
  const existing = readVisitor();

  const visitor: Visitor = existing
    ? {
        ...existing,
        visits:
          now - existing.lastSeen > NEW_VISIT_GAP_MS
            ? existing.visits + 1
            : existing.visits,
        lastSeen: now,
      }
    : {
        id: crypto.randomUUID(),
        firstSeen: now,
        lastSeen: now,
        visits: 1,
      };

  try {
    window.localStorage.setItem(VISITOR_KEY, JSON.stringify(visitor));
  } catch {
    // Storage pieno o disabilitato (es. navigazione privata): la misurazione
    // si degrada, l'app continua a funzionare. Mai far fallire l'app per una
    // metrica.
  }

  return visitor;
}

/**
 * Registra un evento. Non lancia mai eccezioni e non blocca la UI.
 *
 * Usa `sendBeacon` quando disponibile: l'evento parte anche se l'utente chiude
 * la pagina nello stesso istante.
 */
export function track(
  event: TrackedEvent,
  props: Record<string, string | number | boolean> = {}
): void {
  if (typeof window === "undefined") return;

  try {
    const visitor = touchVisitor();

    const payload = JSON.stringify({
      event,
      visitorId: visitor?.id ?? "unknown",
      visits: visitor?.visits ?? 0,
      daysSinceFirstVisit: visitor
        ? Math.floor((Date.now() - visitor.firstSeen) / DAY_MS)
        : 0,
      props,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/track",
        new Blob([payload], { type: "application/json" })
      );
      return;
    }

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Ignorato di proposito: vedi sopra.
    });
  } catch {
    // Ignorato di proposito: vedi sopra.
  }
}
