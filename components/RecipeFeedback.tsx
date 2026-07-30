"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface RecipeFeedbackProps {
  /** Serve solo a resettare il componente quando cambia ricetta. */
  recipeTitle: string;
}

/**
 * Pollice su / pollice giù sulla ricetta.
 *
 * Senza account e senza email, questo è l'unico canale per capire se le
 * ricette sono buone o solo plausibili. Due click valgono più di tre feature
 * nuove costruite a intuito.
 *
 * Volutamente non chiediamo di scrivere un commento: alza l'attrito e quasi
 * nessuno lo compila. Il "perché" si scopre parlando con le persone di
 * persona, non con un campo di testo.
 */
export function RecipeFeedback({ recipeTitle }: RecipeFeedbackProps) {
  const [rating, setRating] = useState<"up" | "down" | null>(null);

  function handleRate(value: "up" | "down") {
    if (rating !== null) return;
    setRating(value);
    track("recipe_rated", { rating: value, recipe: recipeTitle.slice(0, 60) });
  }

  if (rating !== null) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        {rating === "up"
          ? "Grazie! Buon appetito 🍽️"
          : "Grazie, ne terremo conto."}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-sm text-muted-foreground">
        Questa ricetta ti convince?
      </span>
      <button
        type="button"
        onClick={() => handleRate("up")}
        aria-label="Sì, mi convince"
        className={cn(
          "flex size-9 cursor-pointer items-center justify-center rounded-full border border-border",
          "text-muted-foreground transition-colors hover:border-accent hover:text-accent"
        )}
      >
        <ThumbsUp className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => handleRate("down")}
        aria-label="No, non mi convince"
        className={cn(
          "flex size-9 cursor-pointer items-center justify-center rounded-full border border-border",
          "text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
        )}
      >
        <ThumbsDown className="size-4" />
      </button>
    </div>
  );
}
