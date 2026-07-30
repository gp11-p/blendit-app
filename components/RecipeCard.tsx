import { UtensilsCrossed } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import type { Recipe } from "@/lib/types";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Card className="shadow-md shadow-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="size-5 shrink-0 text-primary" />
          <CardTitle className="text-2xl">{recipe.title}</CardTitle>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>⏱ {recipe.time}</span>
          <span>📊 {recipe.difficulty}</span>
          <span>🔥 {recipe.calories} kcal</span>
          <span>
            👥 {recipe.servings} {recipe.servings === 1 ? "persona" : "persone"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {recipe.missingIngredients.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground">
              Ingredienti mancanti:
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
              {recipe.missingIngredients.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-foreground">Passi:</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-foreground">
            {recipe.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
