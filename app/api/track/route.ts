import { NextResponse } from "next/server";
import { getClientKey, rateLimit } from "@/lib/rateLimit";
import { TRACKED_EVENTS, type TrackedEvent } from "@/lib/analytics-events";

// Endpoint di misurazione: riceve eventi anonimi dal browser e li scrive nei
// log del server (visibili nella dashboard Vercel → Logs).
//
// Perché non uno strumento di analytics vero: costa zero, non richiede account
// né cookie, e per le prime settimane di test bastano i log. Quando i numeri
// diventano seri, si sostituisce solo il corpo di questa funzione con una
// chiamata a Vercel Web Analytics, Umami o Plausible: il client non cambia.
//
// IMPORTANTE: qui non deve MAI arrivare nulla che identifichi una persona.
// L'ID che riceviamo è casuale, generato dal browser, e non è collegato a
// nessun account (non esistono account). Vedi app/privacy/page.tsx.

const MAX_PROPS_LENGTH = 500;

export async function POST(request: Request) {
  // Limite generoso: un utente attivo genera qualche decina di eventi.
  // Serve solo a impedire che qualcuno riempia i log.
  const limit = rateLimit(getClientKey(request, "track"), 120, 60_000);
  if (!limit.allowed) {
    // Silenzioso di proposito: un evento perso non è un problema, e non
    // vogliamo che il client mostri errori all'utente per una metrica.
    return new NextResponse(null, { status: 204 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;

  // Accettiamo solo eventi da una lista chiusa: impedisce che l'endpoint
  // diventi un posto dove chiunque scrive testo arbitrario nei nostri log.
  const event = raw.event;
  if (
    typeof event !== "string" ||
    !(TRACKED_EVENTS as readonly string[]).includes(event)
  ) {
    return new NextResponse(null, { status: 204 });
  }

  const visitorId =
    typeof raw.visitorId === "string" ? raw.visitorId.slice(0, 64) : "unknown";
  const visits = typeof raw.visits === "number" ? raw.visits : 0;
  const daysSinceFirstVisit =
    typeof raw.daysSinceFirstVisit === "number" ? raw.daysSinceFirstVisit : 0;

  // Le proprietà extra vengono troncate: nessun campo libero lungo nei log.
  const props =
    typeof raw.props === "object" && raw.props !== null
      ? JSON.stringify(raw.props).slice(0, MAX_PROPS_LENGTH)
      : "{}";

  // Una riga JSON per evento: si filtra facilmente nei log di Vercel e si può
  // incollare in un foglio di calcolo per contare ritorni e attivazione.
  console.log(
    JSON.stringify({
      type: "blendit_event",
      event: event as TrackedEvent,
      visitorId,
      visits,
      daysSinceFirstVisit,
      props,
      at: new Date().toISOString(),
    })
  );

  return new NextResponse(null, { status: 204 });
}
