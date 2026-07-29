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
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{recipe.title}</CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>⏱ {recipe.time}</span>
          <span>📊 {recipe.difficulty}</span>
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
