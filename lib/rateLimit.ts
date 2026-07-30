// Rate limiter "a finestra scorrevole", tenuto in memoria.
//
// Perché così e non con Redis o un database: non costa nulla e non aggiunge
// dipendenze. Il compromesso è che i contatori vivono nella memoria di una
// singola istanza serverless: se una richiesta finisce su un'istanza appena
// avviata, riparte da zero. Quindi è una protezione contro l'abuso casuale
// (uno script che martella l'endpoint), NON una barriera di sicurezza.
//
// Il vero freno di emergenza resta lo spending limit mensile impostato sulla
// console Anthropic: quello è l'unica cosa che garantisce che il progetto non
// possa costare più di quanto hai deciso.

interface Bucket {
  /** Timestamp (ms) delle richieste ancora dentro la finestra. */
  hits: number[];
}

const buckets = new Map<string, Bucket>();

// Limite di sicurezza: se la mappa cresce troppo (tanti IP diversi, o un
// attacco che varia l'IP) la svuotiamo invece di consumare memoria senza fine.
const MAX_TRACKED_KEYS = 5000;

export interface RateLimitResult {
  allowed: boolean;
  /** Richieste ancora disponibili nella finestra corrente. */
  remaining: number;
  /** Secondi da aspettare prima di riprovare (0 se la richiesta è permessa). */
  retryAfterSeconds: number;
}

/**
 * Registra una richiesta e dice se è permessa.
 *
 * @param key    identificatore del chiamante (di solito l'IP + il nome della rotta)
 * @param limit  numero massimo di richieste nella finestra
 * @param windowMs ampiezza della finestra in millisecondi
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) {
    buckets.clear();
  }

  const bucket = buckets.get(key) ?? { hits: [] };

  // Teniamo solo le richieste ancora dentro la finestra temporale.
  const windowStart = now - windowMs;
  const recentHits = bucket.hits.filter((timestamp) => timestamp > windowStart);

  if (recentHits.length >= limit) {
    const oldestHit = recentHits[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestHit + windowMs - now) / 1000)
    );
    buckets.set(key, { hits: recentHits });
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  recentHits.push(now);
  buckets.set(key, { hits: recentHits });

  return {
    allowed: true,
    remaining: limit - recentHits.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Ricava un identificatore del chiamante dagli header della richiesta.
 *
 * Su Vercel l'IP reale arriva in `x-forwarded-for` (il primo della lista: gli
 * altri sono i proxy attraversati). In locale spesso non c'è nessun header:
 * in quel caso usiamo "local", così in sviluppo il limite è condiviso ma non
 * dà fastidio.
 */
export function getClientKey(request: Request, scope: string): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    "local";

  return `${scope}:${ip}`;
}

/** Risposta standard 429, con l'header che dice al client quando riprovare. */
export function tooManyRequestsResponse(
  result: RateLimitResult,
  message: string
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(result.retryAfterSeconds),
    },
  });
}
