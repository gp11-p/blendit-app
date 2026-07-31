// Id anonimo che identifica "questo dispositivo" per la persistenza vera
// (dispensa, piano pasti, lista della spesa) su Supabase.
//
// Deliberatamente SEPARATO dall'id anonimo di lib/analytics.ts: quello serve
// solo a contare visite in aggregato, questo invece possiede dati reali
// (dispensa e preferenze alimentari sono dati GDPR art. 9, vedi CLAUDE.md) -
// non devono condividere lo stesso identificatore.
//
// Non e' un account: e' un valore leggibile da chiunque abbia accesso al
// browser, esattamente come oggi con localStorage. Cancellare i dati del
// sito ne genera uno nuovo alla prossima visita, perdendo l'accesso ai dati
// precedenti (nessuna sincronizzazione tra dispositivi senza login vero).

const DEVICE_ID_KEY = "blendit-device-id";

let cachedDeviceId: string | null = null;

/** Legge (o crea) l'id del dispositivo. Va chiamato solo lato client. */
export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      cachedDeviceId = existing;
      return existing;
    }
  } catch {
    // localStorage non disponibile: generiamo un id valido solo per questa
    // sessione, meglio di niente.
  }

  const created = crypto.randomUUID();
  try {
    window.localStorage.setItem(DEVICE_ID_KEY, created);
  } catch {
    // Storage pieno o non disponibile: l'id non sopravvive al refresh.
  }
  cachedDeviceId = created;
  return created;
}

/** Header da allegare a ogni chiamata verso le API di persistenza. */
export function deviceHeaders(json = false): HeadersInit {
  const headers: Record<string, string> = { "x-blendit-device-id": getDeviceId() };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}
