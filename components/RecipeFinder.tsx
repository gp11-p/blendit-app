"use client";

import { useState } from "react";
import { IngredientInput } from "@/components/IngredientInput";
import { IngredientChip } from "@/components/IngredientChip";
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { mockRecipe } from "@/lib/mock-recipe";

export function RecipeFinder() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [showRecipe, setShowRecipe] = useState(false);

  function handleAdd(ingredient: string) {
    setIngredients((prev) =>
      prev.includes(ingredient) ? prev : [...prev, ingredient]
    );
    setShowRecipe(false);
  }

  function handleRemove(ingredient: string) {
    setIngredients((prev) => prev.filter((item) => item !== ingredient));
    setShowRecipe(false);
  }

  const canSearch = ingredients.length >= 2;

  return (
    <section className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Cosa hai in frigo?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Dimmelo e ti dico cosa cucinare stasera.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <IngredientInput onAdd={handleAdd} />
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ingredient) => (
              <IngredientChip
                key={ingredient}
                label={ingredient}
                onRemove={() => handleRemove(ingredient)}
              />
            ))}
          </div>
        )}
      </div>

      <Button
        type="button"
        disabled={!canSearch}
        onClick={() => setShowRecipe(true)}
        className="h-12 w-full rounded-full text-base font-semibold"
      >
        Trova una ricetta
      </Button>

      {showRecipe && <RecipeCard recipe={mockRecipe} />}
    </section>
  );
}
