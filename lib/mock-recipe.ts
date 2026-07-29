import type { Recipe } from "./types";

// Placeholder recipe for Fase 2 — Fase 3 replaces this with a real call to Claude.
export const mockRecipe: Recipe = {
  title: "Pasta al pomodoro e basilico",
  time: "20 min",
  difficulty: "Facile",
  missingIngredients: ["Basilico fresco", "Parmigiano"],
  steps: [
    "Metti a bollire abbondante acqua salata e cuoci la pasta secondo i tempi sulla confezione.",
    "In una padella scalda un filo d'olio e fai soffriggere uno spicchio d'aglio.",
    "Aggiungi la passata di pomodoro, sala e lascia cuocere a fuoco medio per 10 minuti.",
    "Scola la pasta e saltala nella padella con il sugo per un minuto.",
    "Impiatta con basilico fresco spezzettato e una spolverata di parmigiano.",
  ],
};
