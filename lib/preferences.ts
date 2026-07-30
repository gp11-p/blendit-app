import type { DishType, MaxTime, Preferences } from "./types";

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

export const DEFAULT_PREFERENCES: Preferences = {
  maxTime: null,
  diets: [],
  dishType: "a caso",
};
