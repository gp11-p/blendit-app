"use client";

import { useState } from "react";
import { CalendarPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DAYS } from "@/lib/useMealPlan";
import type { Recipe } from "@/lib/types";

interface AddToPlanButtonProps {
  recipe: Recipe;
  onAdd: (day: string, recipe: Recipe) => void;
}

export function AddToPlanButton({ recipe, onAdd }: AddToPlanButtonProps) {
  const [day, setDay] = useState(DAYS[0]);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    onAdd(day, recipe);
    setAdded(true);
  }

  if (added) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-accent">
        <Check className="size-4" />
        Aggiunta al piano di {day}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={day}
        onChange={(event) => setDay(event.target.value)}
        aria-label="Giorno della settimana"
        className="rounded-lg border border-input bg-transparent px-2 py-1 text-sm text-foreground"
      >
        {DAYS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <Button type="button" variant="ghost" size="sm" onClick={handleAdd}>
        <CalendarPlus className="size-4" />
        Aggiungi al piano
      </Button>
    </div>
  );
}
