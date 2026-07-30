"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { IngredientInput } from "@/components/IngredientInput";
import { IngredientChip } from "@/components/IngredientChip";
import { PhotoInput } from "@/components/PhotoInput";
import { PreferencesPanel } from "@/components/PreferencesPanel";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeCardSkeleton } from "@/components/RecipeCardSkeleton";
import { FridgeEmptyState } from "@/components/FridgeEmptyState";
import { Button } from "@/components/ui/button";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import type { Preferences, Recipe } from "@/lib/types";

export function RecipeFinder() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(
    DEFAULT_PREFERENCES
  );
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [previousTitles, setPreviousTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAddMany(newIngredients: string[]) {
    setIngredients((prev) => {
      const merged = [...prev];
      for (const item of newIngredients) {
        if (!merged.includes(item)) merged.push(item);
      }
      return merged;
    });
    setRecipe(null);
    setPreviousTitles([]);
    setError(null);
  }

  function handleAdd(ingredient: string) {
    handleAddMany([ingredient]);
  }

  function handleRemove(ingredient: string) {
    setIngredients((prev) => prev.filter((item) => item !== ingredient));
    setRecipe(null);
    setPreviousTitles([]);
    setError(null);
  }

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setRecipe(null);
    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, preferences, previousTitles }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Errore sconosciuto.");
      }
      setRecipe(data);
      setPreviousTitles((prev) => [...prev, data.title].slice(-5));
    } catch {
      setError("Non sono riuscito a trovare una ricetta. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  const canSearch = ingredients.length >= 2 && !loading;

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
        <PhotoInput onIngredientsFound={handleAddMany} />
      </div>

      <PreferencesPanel preferences={preferences} onChange={setPreferences} />

      <Button
        type="button"
        disabled={!canSearch}
        onClick={handleSearch}
        className="h-12 w-full rounded-full text-base font-semibold"
      >
        {loading ? "Sto pensando a una ricetta..." : "Trova una ricetta"}
      </Button>

      {loading && <RecipeCardSkeleton />}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-center text-sm text-destructive">
          <p>{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSearch}
          >
            Riprova
          </Button>
        </div>
      )}

      {!loading && !error && recipe && (
        <div className="flex flex-col items-center gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <RecipeCard recipe={recipe} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSearch}
            className="text-muted-foreground"
          >
            <RefreshCw className="size-4" />
            Non ti piace? Prova un&apos;altra ricetta
          </Button>
        </div>
      )}

      {!loading && !error && !recipe && ingredients.length === 0 && (
        <FridgeEmptyState />
      )}
    </section>
  );
}
