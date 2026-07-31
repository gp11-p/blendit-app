"use client";

import { useState } from "react";
import { ChefHat, Loader2, UtensilsCrossed } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CookingMode } from "@/components/CookingMode";
import type { Recipe } from "@/lib/types";

interface RecipeCardProps {
  recipe: Recipe;
  /** Nomi degli ingredienti in dispensa, per proporre sostituzioni realizzabili. */
  pantryNames: string[];
  /** Chiamata quando una sostituzione va a buon fine: aggiorna i passi a monte. */
  onSubstituted: (missingIngredient: string, revisedSteps: string[]) => void;
}

interface SubstitutionAlternative {
  name: string;
  note: string;
}

type SubstitutionState =
  | { status: "loading" }
  | { status: "found"; alternatives: SubstitutionAlternative[] }
  | { status: "not-found" }
  | { status: "error"; message: string };

export function RecipeCard({
  recipe,
  pantryNames,
  onSubstituted,
}: RecipeCardProps) {
  const [cookingOpen, setCookingOpen] = useState(false);
  // Elenco "congelato" al primo render di questa ricetta: una sostituzione
  // riuscita toglie l'ingrediente da recipe.missingIngredients (serve alla
  // lista della spesa, vedi RecipeFinder), ma la riga qui deve restare
  // visibile con l'esito, non sparire.
  const [missingList] = useState(recipe.missingIngredients);
  const [substitutions, setSubstitutions] = useState<
    Record<string, SubstitutionState>
  >({});

  async function handleSubstitute(missingIngredient: string) {
    setSubstitutions((prev) => ({
      ...prev,
      [missingIngredient]: { status: "loading" },
    }));

    try {
      const res = await fetch("/api/substitute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missingIngredient,
          recipeTitle: recipe.title,
          steps: recipe.steps,
          availableIngredients: pantryNames,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "");
      }

      if (data.found) {
        setSubstitutions((prev) => ({
          ...prev,
          [missingIngredient]: {
            status: "found",
            alternatives: data.alternatives,
          },
        }));
        onSubstituted(missingIngredient, data.revisedSteps);
      } else {
        setSubstitutions((prev) => ({
          ...prev,
          [missingIngredient]: { status: "not-found" },
        }));
      }
    } catch (err) {
      const serverMessage = err instanceof Error ? err.message : "";
      setSubstitutions((prev) => ({
        ...prev,
        [missingIngredient]: {
          status: "error",
          message:
            serverMessage.length > 0
              ? serverMessage
              : "Non sono riuscito a trovare un'alternativa. Riprova.",
        },
      }));
    }
  }

  return (
    <>
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
              👥 {recipe.servings}{" "}
              {recipe.servings === 1 ? "persona" : "persone"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {missingList.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground">
                Ingredienti mancanti:
              </p>
              <ul className="mt-1 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {missingList.map((item) => {
                  const state = substitutions[item];
                  return (
                    <li key={item} className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={
                            state?.status === "found"
                              ? "text-muted-foreground/60 line-through"
                              : ""
                          }
                        >
                          {item}
                        </span>
                        {!state && (
                          <button
                            type="button"
                            onClick={() => handleSubstitute(item)}
                            className="shrink-0 cursor-pointer text-xs text-primary hover:underline"
                          >
                            non ce l&apos;ho →
                          </button>
                        )}
                        {state?.status === "loading" && (
                          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      {state?.status === "found" && (
                        <p className="pl-5 text-xs text-accent">
                          Sostituito con{" "}
                          {state.alternatives.map((a) => a.name).join(" o ")}
                          {state.alternatives[0]?.note
                            ? ` — ${state.alternatives[0].note}`
                            : ""}
                        </p>
                      )}
                      {state?.status === "not-found" && (
                        <p className="pl-5 text-xs text-muted-foreground">
                          Nessuna alternativa sensata con quello che hai in
                          dispensa.
                        </p>
                      )}
                      {state?.status === "error" && (
                        <p className="pl-5 text-xs text-destructive">
                          {state.message}
                        </p>
                      )}
                    </li>
                  );
                })}
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
          <Button
            type="button"
            variant="outline"
            onClick={() => setCookingOpen(true)}
          >
            <ChefHat className="size-4" />
            Modalità cucina
          </Button>
        </CardContent>
      </Card>

      {cookingOpen && (
        <CookingMode recipe={recipe} onClose={() => setCookingOpen(false)} />
      )}
    </>
  );
}
