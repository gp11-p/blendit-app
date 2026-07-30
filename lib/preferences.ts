import type { DishType, MaxTime, Preferences, Servings } from "./types";

export const TIME_OPTIONS: { value: MaxTime; label: string }[] = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "60 min" },
  { value: null, label: "Nessun limite" },
];

export const DIET_OPTIONS = [
  "Vegetariano",
  "Vegano",
  "Senza glutine",
  "Senza lattosio",
] as const;

export const DISH_TYPE_OPTIONS: { value: DishType; label: string }[] = [
  { value: "primo", label: "Primo" },
  { value: "secondo", label: "Secondo" },
  { value: "piatto unico", label: "Piatto unico" },
  { value: "contorno", label: "Contorno" },
  { value: "dolce", label: "Dolce" },
  { value: "a caso", label: "A caso" },
];

export const SERVINGS_OPTIONS: { value: Servings; label: string }[] = [
  { value: 1, label: "1 persona" },
  { value: 2, label: "2 persone" },
  { value: 4, label: "4 persone" },
  { value: 6, label: "6 persone" },
  { value: null, label: "Non importa" },
];

export const DEFAULT_PREFERENCES: Preferences = {
  maxTime: null,
  diets: [],
  dishType: "a caso",
  servings: null,
};
