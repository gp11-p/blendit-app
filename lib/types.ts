export interface Recipe {
  title: string;
  time: string;
  difficulty: "Facile" | "Media" | "Difficile";
  missingIngredients: string[];
  steps: string[];
}
