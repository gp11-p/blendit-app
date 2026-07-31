"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { AddToPlanButton } from "@/components/AddToPlanButton";
import { IngredientInput } from "@/components/IngredientInput";
import { InstallPrompt } from "@/components/InstallPrompt";
import { MealPlanPanel } from "@/components/MealPlanPanel";
import { PantryPanel } from "@/components/PantryPanel";
import { PartnerProductsPreview } from "@/components/PartnerProductsPreview";
import { PhotoInput } from "@/components/PhotoInput";
import { PreferencesPanel } from "@/components/PreferencesPanel";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeCardSkeleton } from "@/components/RecipeCardSkeleton";
import { RecipeFeedback } from "@/components/RecipeFeedback";
import { ShareRecipeButton } from "@/components/ShareRecipeButton";
import { FridgeEmptyState } from "@/components/FridgeEmptyState";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { useMealPlan } from "@/lib/useMealPlan";
import { usePantry } from "@/lib/usePantry";
import type { Preferences, Recipe } from "@/lib/types";

export function RecipeFinder() {
  // Gli ingredienti non vivono più in uno stato temporaneo: stanno in
  // dispensa, che sopravvive alla chiusura della pagina. È il cambiamento che
  // toglie il motivo principale per cui una persona non tornava — dover
  // ridigitare ogni volta le stesse dieci cose.
  const pantry = usePantry();

  const [preferences, setPreferences] = useState<Preferences>(
    DEFAULT_PREFERENCES
  );
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  // Identifica la ricetta a schermo indipendentemente dal titolo (due
  // ricette diverse possono avere lo stesso titolo) e senza il limite di
  // previousTitles (troncato a 5): usata come key per resettare feedback e
  // stato "aggiunta al piano" ad ogni nuova ricetta, anche oltre la 5ª.
  const [recipeKey, setRecipeKey] = useState(0);
  const [previousTitles, setPreviousTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { plan, addMeal, removeMeal } = useMealPlan();

  // Solo gli ingredienti "accesi" in dispensa entrano nella ricetta.
  const ingredients = pantry.selectedNames;

  // Cambiare gli ingredienti rende la ricetta a schermo obsoleta: la togliamo
  // invece di lasciare qualcosa che non corrisponde più a quello che si vede.
  function resetRecipe() {
    setRecipe(null);
    setPreviousTitles([]);
    setError(null);
  }

  function handleAdd(ingredient: string) {
    const dropped = pantry.add(ingredient);
    track("ingredient_added", { source: "manual" });
    resetRecipe();
    if (dropped > 0) {
      setError(
        "Dispensa piena (max 60 ingredienti): alcuni non sono stati aggiunti."
      );
    }
  }

  function handlePhotoIngredients(found: string[]) {
    const dropped = pantry.addMany(found);
    track("photo_used", { found: found.length });
    resetRecipe();
    if (dropped > 0) {
      setError(
        "Dispensa piena (max 60 ingredienti): alcuni non sono stati aggiunti."
      );
    }
  }

  function handleRemove(ingredient: string) {
    pantry.remove(ingredient);
    resetRecipe();
  }

  function handleToggle(ingredient: string) {
    pantry.toggle(ingredient);
    resetRecipe();
  }

  async function handleSearch(isRegeneration: boolean) {
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
        throw new Error(data.error ?? "");
      }

      const found = data as Recipe;
      setRecipe(found);
      setRecipeKey((n) => n + 1);
      setPreviousTitles((prev) => [...prev, found.title].slice(-5));

      track(isRegeneration ? "recipe_regenerated" : "recipe_generated", {
        ingredients: ingredients.length,
        hasPreferences:
          preferences.maxTime !== null ||
          preferences.diets.length > 0 ||
          preferences.dishType !== "a caso" ||
          preferences.servings !== null ||
          preferences.maxCalories !== null,
      });

      // Segnale commerciale: quali ingredienti mancano più spesso alle
      // persone. È il dato che rende concreta una partnership con un
      // supermercato (il modello a commissioni del pitch). Resta aggregato e
      // anonimo: nessun profilo per singola persona.
      for (const missing of found.missingIngredients) {
        track("missing_ingredient", { name: missing.slice(0, 40) });
      }
    } catch (err) {
      // Se il server ha spiegato il problema (per esempio il limite di
      // richieste), mostriamo il suo messaggio: l'utente capisce che deve
      // solo aspettare, invece di credere che l'app sia rotta.
      const serverMessage = err instanceof Error ? err.message : "";
      setError(
        serverMessage.length > 0
          ? serverMessage
          : "Non sono riuscito a trovare una ricetta. Riprova."
      );
    } finally {
      setLoading(false);
    }
  }

  const canSearch = ingredients.length >= 2 && !loading;
  const needsMoreSelected =
    !loading && pantry.items.length > 0 && ingredients.length < 2;

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

      <MealPlanPanel
        plan={plan}
        onRemove={removeMeal}
        onItemBought={(name) => pantry.addMany([name])}
      />

      <div className="flex flex-col gap-3">
        <IngredientInput onAdd={handleAdd} />
        <PantryPanel
          items={pantry.items}
          onToggle={handleToggle}
          onRemove={handleRemove}
          onSetAllSelected={(selected) => {
            pantry.setAllSelected(selected);
            resetRecipe();
          }}
        />
        <PhotoInput onIngredientsFound={handlePhotoIngredients} />
      </div>

      <PreferencesPanel preferences={preferences} onChange={setPreferences} />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          disabled={!canSearch}
          onClick={() => handleSearch(false)}
          className="h-12 w-full rounded-full text-base font-semibold"
        >
          {loading ? "Sto pensando a una ricetta..." : "Trova una ricetta"}
        </Button>
        {needsMoreSelected && (
          <p className="text-center text-xs text-muted-foreground">
            Seleziona almeno 2 ingredienti dalla dispensa.
          </p>
        )}
      </div>

      {loading && <RecipeCardSkeleton />}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-center text-sm text-destructive">
          <p>{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSearch(false)}
          >
            Riprova
          </Button>
        </div>
      )}

      {!loading && !error && recipe && (
        <div className="flex flex-col gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <RecipeCard recipe={recipe} />
          {recipe.missingIngredients.length > 0 && (
            <PartnerProductsPreview ingredients={recipe.missingIngredients} />
          )}
          <RecipeFeedback key={recipeKey} recipeTitle={recipe.title} />
          <div className="flex flex-col items-center gap-2">
            <AddToPlanButton
              key={recipeKey}
              recipe={recipe}
              onAdd={(day, planned, mealType) => {
                addMeal(day, planned, mealType);
                // Gli ingredienti usati per questa ricetta si considerano
                // consumati: si disattivano (non si cancellano) così non
                // vengono riproposti per la prossima ricetta. Niente
                // resetRecipe() qui: la ricetta appena pianificata deve
                // restare a schermo come conferma.
                pantry.deselectMany(ingredients);
                track("meal_planned");
              }}
            />
            <ShareRecipeButton recipe={recipe} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleSearch(true)}
              className="text-muted-foreground"
            >
              <RefreshCw className="size-4" />
              Non ti piace? Prova un&apos;altra ricetta
            </Button>
          </div>
        </div>
      )}

      {!loading && !error && !recipe && pantry.items.length === 0 && (
        <FridgeEmptyState />
      )}

      <InstallPrompt />
    </section>
  );
}
