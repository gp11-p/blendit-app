import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client Supabase SOLO lato server, con la service-role key: bypassa la Row
// Level Security attiva sulle tabelle (vedi supabase/schema.sql), quindi ogni
// query fatta con questo client deve filtrare a mano per owner_id (vedi
// lib/ownerId.ts e le route in app/api/pantry, app/api/meal-plan,
// app/api/shopping-checked).
//
// NON importare mai questo file da un componente "use client": la chiave
// finirebbe nel bundle inviato al browser.

let cachedClient: SupabaseClient | null | undefined;

/**
 * Ritorna il client Supabase, o `null` se le variabili d'ambiente non sono
 * configurate. Il chiamante decide come degradare (vedi le route API: si
 * comporta come un localStorage corrotto, l'app resta usabile nella sessione
 * ma non persiste tra un refresh e l'altro).
 */
export function getSupabaseServer(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    cachedClient = null;
    return null;
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return cachedClient;
}
