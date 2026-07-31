// Stesso spirito di getClientKey() in lib/rateLimit.ts: ricava dalla
// richiesta un identificatore da usare lato server, qui per filtrare le
// query Supabase invece che per contare le richieste.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Legge l'id del dispositivo dall'header `x-blendit-device-id` (vedi
 * lib/deviceId.ts per come viene generato lato client).
 *
 * Ritorna `null` se manca o non ha la forma di un UUID: non e' un vero
 * controllo di sicurezza (chiunque puo' comunque generare un UUID valido a
 * mano), solo una difesa contro richieste malformate o accidentali.
 */
export function getOwnerId(request: Request): string | null {
  const deviceId = request.headers.get("x-blendit-device-id");
  if (!deviceId || !UUID_PATTERN.test(deviceId)) return null;
  return deviceId;
}
