// Dati di esempio della demo /pro.
//
// Tutto finto, ma deve essere CREDIBILE: un nutrizionista che legge
// "Paziente 1" o "Ricetta A" smette di ascoltare. Nomi italiani veri, un
// piano con la struttura che usano davvero (colazione, spuntino, pranzo,
// spuntino, cena), domande di sostituzione plausibili.
//
// Stanno tutti qui in un file solo: quando dopo un'intervista scopri che
// qualcosa suona falso, lo correggi in un posto e la demo migliora.
//
// ATTENZIONE: nessuno di questi dati è reale e nessuno viene salvato. La
// pagina /pro è statica e non chiama né l'AI né il database.

export interface DemoMeal {
  time: string;
  name: string;
  items: string[];
}

export interface DemoDiaryEntry {
  id: string;
  day: string;
  meal: string;
  recipe: string;
  loggedAt: string;
  note?: string;
  /** Se true, compare solo dopo l'azione dell'utente nella demo. */
  isLive?: boolean;
}

/** Campi del paziente che restano fissi anche quando la demo è personalizzata. */
export const DEMO_PATIENT = {
  since: "Piano dal 12 gennaio",
  week: "4ª settimana",
  goal: "Ricomposizione, 2 allenamenti a settimana",
  constraints: ["Niente lattosio", "Cena entro le 20:30", "Budget medio"],
} as const;

/** Campi del nutrizionista che restano fissi anche quando la demo è personalizzata. */
export const DEMO_NUTRITIONIST = {
  role: "Biologa nutrizionista",
} as const;

/**
 * I valori che si possono personalizzare per un cliente specifico prima di
 * un'intervista: nome del nutrizionista, nome del paziente, e i numeri del
 * riepilogo. Vivono nell'URL della pagina (vedi ProDemo.tsx), non vengono
 * mai salvati su un database — restano dati finti, solo su misura.
 */
export interface DemoOverrides {
  nutritionistName: string;
  patientName: string;
  mealsLogged: number;
  mealsTotal: number;
  substitutions: number;
}

export const DEFAULT_OVERRIDES: DemoOverrides = {
  nutritionistName: "Dott.ssa Elena Ferraro",
  patientName: "Marco Colella",
  mealsLogged: 18,
  mealsTotal: 28,
  substitutions: 6,
};

/** "Elena Bianchi" -> "EB", "Marco" -> "MA". */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Il riepilogo prima della visita, ricalcolato dai valori personalizzati
 * così resta sempre coerente con i numeri mostrati accanto — vedi
 * PROGETTO_NUTRIZIONISTI.md §2.3: descrive cosa è successo, mai un giudizio.
 */
export function buildSummary(overrides: DemoOverrides): string {
  const firstName =
    overrides.patientName.trim().split(/\s+/)[0] || overrides.patientName;
  const { mealsLogged, mealsTotal, substitutions } = overrides;
  return (
    `${firstName} ha registrato ${mealsLogged} past${mealsLogged === 1 ? "o" : "i"} su ${mealsTotal}. ` +
    `Salta quasi sempre la colazione. ` +
    `${substitutions} sostituzion${substitutions === 1 ? "e" : "i"} chiest${substitutions === 1 ? "a" : "e"}, tutte sui legumi.`
  );
}

/** I tre numeri sotto il riepilogo, ricalcolati dai valori personalizzati. */
export function buildStats(overrides: DemoOverrides) {
  return [
    { key: "meals", label: "Pasti registrati", value: String(overrides.mealsLogged), highlight: false },
    { key: "substitutions", label: "Sostituzioni", value: String(overrides.substitutions), highlight: false },
    // Fisso a 0 di proposito: è il punto della demo, non un dato da personalizzare.
    { key: "messages", label: "Messaggi a te", value: "0", highlight: true },
  ] as const;
}

/**
 * Esempi delle sostituzioni riassunte nel numero "Sostituzioni": mostrati
 * aprendo quella statistica nell'atto 3, per dare profondità al riepilogo
 * senza che il nutrizionista debba rispondere a niente — coerente con
 * "Messaggi a te: 0". Coerenti con "tutte sui legumi" in buildSummary().
 */
export const DEMO_SUBSTITUTION_LOG = [
  { day: "Lunedì", from: "Legumi 120g", to: "Ceci 120g" },
  { day: "Mercoledì", from: "Legumi 120g", to: "Lenticchie 120g" },
  { day: "Venerdì", from: "Legumi 120g", to: "Ceci 120g" },
] as const;

/** Il file che il nutrizionista "carica" nell'atto 1. */
export const DEMO_SOURCE_FILE = {
  name: "Piano_Colella_gennaio.pdf",
  size: "248 KB",
  pages: 3,
} as const;

/** Il piano dopo che l'AI lo ha strutturato. */
export const DEMO_PLAN: DemoMeal[] = [
  {
    time: "07:30",
    name: "Colazione",
    items: ["Yogurt di soia 150g", "Avena 40g", "Frutta fresca 150g"],
  },
  {
    time: "10:30",
    name: "Spuntino",
    items: ["Frutta secca 20g"],
  },
  {
    time: "13:00",
    name: "Pranzo",
    items: ["Pasta integrale 80g", "Legumi 120g", "Verdura a volontà", "Olio EVO 10g"],
  },
  {
    time: "17:00",
    name: "Spuntino",
    items: ["Frutta fresca 150g"],
  },
  {
    time: "20:00",
    name: "Cena",
    items: ["Cereale in chicchi 70g", "Verdura a volontà", "Olio EVO 10g"],
  },
];

/** Le equivalenze che la dottoressa ha definito una volta sola. */
export const DEMO_EXCHANGES = [
  { from: "Pasta integrale 80g", to: "Orzo 80g · Riso 80g · Patate 250g" },
  { from: "Legumi 120g", to: "Ceci 120g · Lenticchie 120g · Fagioli 120g" },
  { from: "Verdura a volontà", to: "Qualsiasi verdura di stagione" },
] as const;

/**
 * Cosa il paziente finto ha in dispensa, usato dal chatbot dell'atto 1
 * (`app/api/pro-demo-chat/route.ts`) per proporre solo alternative che
 * esistono davvero — mai un ingrediente "da comprare".
 */
export const DEMO_PANTRY = [
  "Orzo",
  "Riso",
  "Zucchine",
  "Ceci",
  "Lenticchie",
  "Pomodori",
  "Spinaci",
  "Uova",
  "Yogurt greco",
  "Limoni",
] as const;

/** La ricetta che il paziente sta cucinando nell'atto 2. */
export const DEMO_RECIPE = {
  title: "Orzo con zucchine e ceci",
  time: "25 min",
  servings: 1,
  steps: [
    "Sciacqua l'orzo sotto l'acqua fredda e mettilo a bollire in acqua salata.",
    "Taglia le zucchine a rondelle sottili.",
    "Scalda l'olio in padella e salta le zucchine per 6-7 minuti.",
    "Scola l'orzo e uniscilo alle verdure. Manteca fuori dal fuoco.",
    "Aggiungi i ceci già cotti e mescola.",
    "Completa con pepe e un filo d'olio a crudo.",
  ],
  /** Passo mostrato nella demo (indice base 0). */
  currentStep: 3,
  timerLabel: "2:40 rimanenti",
} as const;

/**
 * La domanda che, senza Blendit, sarebbe arrivata su WhatsApp alle 21.
 * Il nome di chi ha impostato la regola è quello personalizzato (vedi
 * ProPhone.tsx), non è scritto qui.
 */
export const DEMO_SUBSTITUTION = {
  question: "Non ho i fagiolini. Posso mettere altro?",
  answer:
    "Sì: con le zucchine resti dentro «verdura a volontà», la porzione non cambia.",
} as const;

/** La cronologia che il nutrizionista vede. */
export const DEMO_DIARY: DemoDiaryEntry[] = [
  {
    id: "live",
    day: "Oggi",
    meal: "Cena",
    recipe: "Orzo con zucchine e ceci",
    loggedAt: "20:14",
    note: "ho usato zucchine al posto dei fagiolini",
    isLive: true,
  },
  {
    id: "d2",
    day: "Oggi",
    meal: "Pranzo",
    recipe: "Pasta e ceci",
    loggedAt: "13:20",
  },
  {
    id: "d3",
    day: "Ieri",
    meal: "Cena",
    recipe: "Riso con verdure saltate",
    loggedAt: "20:05",
    note: "porzione un po' abbondante",
  },
  {
    id: "d4",
    day: "Ieri",
    meal: "Colazione",
    recipe: "Porridge di avena",
    loggedAt: "07:45",
  },
];

/** I tre atti della demo. L'ordine risponde alle obiezioni, in sequenza. */
export const DEMO_STEPS = [
  {
    id: 1,
    label: "Il tuo piano",
    intro:
      "Carichi il piano che hai già scritto, nel formato in cui l'hai scritto. Lo correggi in due minuti e il paziente lo riceve.",
  },
  {
    id: 2,
    label: "Il paziente cucina",
    intro:
      "Un passo alla volta, con i timer. Alla fine può registrare il pasto — se vuole, e senza nessun obbligo.",
  },
  {
    id: 3,
    label: "Cosa vedi tu",
    intro:
      "Cosa è successo tra una visita e l'altra, in una frase. E le domande sulle sostituzioni a cui non hai dovuto rispondere.",
  },
] as const;

export type DemoStepId = (typeof DEMO_STEPS)[number]["id"];
