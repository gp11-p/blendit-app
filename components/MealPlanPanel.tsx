"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ShoppingListPanel } from "@/components/ShoppingListPanel";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { DAYS, type PlannedMeal } from "@/lib/useMealPlan";

interface MealPlanPanelProps {
  plan: PlannedMeal[];
  onRemove: (id: string) => void;
  /** Un articolo spuntato sulla lista della spesa finisce in dispensa. */
  onItemBought: (name: string) => void;
}

export function MealPlanPanel({
  plan,
  onRemove,
  onItemBought,
}: MealPlanPanelProps) {
  const [open, setOpen] = useState(false);
  const daysWithMeals = DAYS.filter((day) =>
    plan.some((meal) => meal.day === day)
  );

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // Ci dice quante persone arrivano davvero al ciclo settimanale
    // (pianifica → compra → cucina), che è la metrica di ritenzione vera.
    if (next && plan.length > 0) track("shopping_list_opened");
  }

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange}>
      <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium text-foreground">
        📅 Il mio piano{plan.length > 0 ? ` (${plan.length})` : ""}
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 pt-4">
        {plan.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nessuna ricetta salvata. Genera una ricetta e aggiungila al
            piano.
          </p>
        ) : (
          daysWithMeals.map((day) => (
            <div key={day}>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                {day}
              </p>
              <ul className="flex flex-col gap-1">
                {plan
                  .filter((meal) => meal.day === day)
                  .map((meal) => (
                    <li
                      key={meal.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground"
                    >
                      <span>
                        {meal.mealType && (
                          <span className="mr-1.5 text-xs font-semibold text-primary">
                            {meal.mealType}
                          </span>
                        )}
                        {meal.recipe.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemove(meal.id)}
                        aria-label={`Rimuovi ${meal.recipe.title} dal piano`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))
        )}
        <ShoppingListPanel plan={plan} onItemBought={onItemBought} />

        {plan.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Il piano resta salvato solo su questo dispositivo/browser.
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
