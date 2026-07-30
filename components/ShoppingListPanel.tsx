"use client";

import { useState } from "react";
import { Check, Copy, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useShoppingList } from "@/lib/useShoppingList";
import type { PlannedMeal } from "@/lib/useMealPlan";

interface ShoppingListPanelProps {
  plan: PlannedMeal[];
  /** Chiamata quando spunti un articolo: finisce in dispensa. */
  onItemBought: (name: string) => void;
}

/**
 * La lista della spesa generata dal piano settimanale.
 *
 * Il dettaglio che conta: quando spunti un articolo, quello entra in
 * dispensa. È il punto in cui il cerchio si chiude — pianifichi, compri,
 * e la settimana dopo Blendit sa già cosa hai in casa senza che tu digiti
 * niente.
 */
export function ShoppingListPanel({
  plan,
  onItemBought,
}: ShoppingListPanelProps) {
  const { items, remaining, toggle, clearChecked, asText } =
    useShoppingList(plan);
  const [copied, setCopied] = useState(false);

  if (items.length === 0) return null;

  function handleToggle(name: string, wasChecked: boolean) {
    toggle(name);
    if (!wasChecked) {
      // Da "da comprare" a "comprato": ora ce l'hai in casa.
      onItemBought(name);
      track("shopping_item_checked");
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(asText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Appunti non disponibili: l'utente può sempre leggere la lista a schermo.
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/50 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ShoppingCart className="size-4" />
          Lista della spesa
        </p>
        <span className="text-xs text-muted-foreground">
          {remaining === 0
            ? "Tutto preso!"
            : `${remaining} da comprare`}
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.name}>
            <button
              type="button"
              onClick={() => handleToggle(item.name, item.checked)}
              aria-pressed={item.checked}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-background/60"
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  item.checked
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-background"
                )}
              >
                {item.checked && <Check className="size-3.5" />}
              </span>
              <span className="flex-1">
                <span
                  className={cn(
                    "text-sm",
                    item.checked
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  )}
                >
                  {item.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.forRecipes.join(" · ")}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-muted-foreground"
        >
          {copied ? (
            <>
              <Check className="size-4" />
              Copiata
            </>
          ) : (
            <>
              <Copy className="size-4" />
              Copia la lista
            </>
          )}
        </Button>
        {remaining < items.length && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearChecked}
            className="text-muted-foreground"
          >
            Azzera le spunte
          </Button>
        )}
      </div>
    </div>
  );
}
