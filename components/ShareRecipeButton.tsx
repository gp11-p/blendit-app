"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import type { Recipe } from "@/lib/types";

interface ShareRecipeButtonProps {
  recipe: Recipe;
}

/** La ricetta come testo leggibile, pronto da incollare in una chat. */
function formatRecipe(recipe: Recipe): string {
  const lines = [
    `🍽️ ${recipe.title}`,
    `⏱️ ${recipe.time} · ${recipe.difficulty} · per ${recipe.servings}`,
    "",
    ...recipe.steps.map((step, index) => `${index + 1}. ${step}`),
  ];

  if (recipe.missingIngredients.length > 0) {
    lines.push("", `🛒 Ti serve: ${recipe.missingIngredients.join(", ")}`);
  }

  lines.push("", "Ricetta creata con Blendit — https://blendit-app.vercel.app");

  return lines.join("\n");
}

/**
 * Condivide la ricetta.
 *
 * È l'unico canale di crescita gratuito che abbiamo: in Italia una ricetta si
 * gira su WhatsApp, non si "condivide sui social". Per questo il testo è
 * formattato per essere leggibile incollato in una chat, e in fondo c'è il
 * link — chi lo riceve può aprirlo senza installare nulla.
 *
 * Su mobile usiamo la Web Share API (apre il menu di condivisione nativo del
 * telefono). Su desktop non esiste quasi mai, quindi ripieghiamo sulla copia
 * negli appunti.
 */
export function ShareRecipeButton({ recipe }: ShareRecipeButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = formatRecipe(recipe);

    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.title, text });
        track("recipe_shared", { method: "native" });
        return;
      }

      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      track("recipe_shared", { method: "clipboard" });
    } catch {
      // L'utente ha annullato la condivisione, o gli appunti non sono
      // disponibili (succede su http non sicuro). Non è un errore da mostrare.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleShare}
      className="text-muted-foreground"
    >
      {copied ? (
        <>
          <Check className="size-4" />
          Copiata negli appunti
        </>
      ) : (
        <>
          <Share2 className="size-4" />
          Condividi la ricetta
        </>
      )}
    </Button>
  );
}
