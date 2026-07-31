export interface NamedQuantity {
  name: string;
  quantity: number;
}

export interface Recipe {
  title: string;
  time: string;
  difficulty: "Facile" | "Media" | "Difficile";
  calories: number;
  servings: number;
  missingIngredients: string[];
  /** Solo per ingredienti forniti, numerabili, e usati davvero da questa ricetta. */
  usedQuantities: NamedQuantity[];
  steps: string[];
}

export type MaxTime = "15" | "30" | "60" | null;

export type Servings = 1 | 2 | 4 | 6 | null;

export type DishType =
  | "primo"
  | "secondo"
  | "piatto unico"
  | "contorno"
  | "dolce"
  | "a caso";

export type MaxCalories = 400 | 600 | 800 | null;

export interface Preferences {
  maxTime: MaxTime;
  diets: string[];
  dishType: DishType;
  servings: Servings;
  maxCalories: MaxCalories;
}
