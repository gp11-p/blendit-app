// Lista chiusa degli eventi che l'app può registrare.
//
// Vive in un file separato perché serve sia al client (lib/analytics.ts) sia
// al server (app/api/track/route.ts), e importare il client dal server
// trascinerebbe dentro codice del browser.
//
// Regola: aggiungi un evento solo se sai già a quale domanda risponde.
// Un evento che non guarderai mai è solo rumore nei log.

export const TRACKED_EVENTS = [
  // --- Attivazione: la persona è arrivata al valore? ---
  "app_opened",
  "ingredient_added",
  "photo_used",
  "recipe_generated",
  "recipe_regenerated",

  // --- Ritenzione: sta usando il ciclo settimanale? ---
  "meal_planned",
  "shopping_list_opened",
  "shopping_item_checked",

  // --- Crescita ---
  "recipe_shared",
  "app_installed",

  // --- Qualità: la ricetta era buona? ---
  "recipe_rated",

  // --- Modalità cucina: la persona resta fino alla fine mentre cucina? ---
  "cooking_mode_started",
  "cooking_mode_completed",

  // --- Segnale commerciale (modello a commissioni del pitch) ---
  // Registra solo QUALE ingrediente manca, in forma aggregata e anonima.
  // Nessun profilo per persona, nessuna pubblicità profilata: serve a capire
  // quali prodotti avrebbero senso in una partnership con un supermercato.
  "missing_ingredient",
] as const;

export type TrackedEvent = (typeof TRACKED_EVENTS)[number];
