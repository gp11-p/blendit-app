"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SelectableChip } from "@/components/SelectableChip";
import {
  DIET_OPTIONS,
  DISH_TYPE_OPTIONS,
  SERVINGS_OPTIONS,
  TIME_OPTIONS,
} from "@/lib/preferences";
import { cn } from "@/lib/utils";
import type { Preferences } from "@/lib/types";

interface PreferencesPanelProps {
  preferences: Preferences;
  onChange: (preferences: Preferences) => void;
}

export function PreferencesPanel({
  preferences,
  onChange,
}: PreferencesPanelProps) {
  const [open, setOpen] = useState(false);

  function toggleDiet(diet: string) {
    const diets = preferences.diets.includes(diet)
      ? preferences.diets.filter((item) => item !== diet)
      : [...preferences.diets, diet];
    onChange({ ...preferences, diets });
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium text-foreground">
        Personalizza
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-4 pt-4">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Tempo massimo
          </p>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((option) => (
              <SelectableChip
                key={option.label}
                label={option.label}
                selected={preferences.maxTime === option.value}
                onToggle={() =>
                  onChange({ ...preferences, maxTime: option.value })
                }
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Dieta
          </p>
          <div className="flex flex-wrap gap-2">
            {DIET_OPTIONS.map((diet) => (
              <SelectableChip
                key={diet}
                label={diet}
                selected={preferences.diets.includes(diet)}
                onToggle={() => toggleDiet(diet)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Porzioni
          </p>
          <div className="flex flex-wrap gap-2">
            {SERVINGS_OPTIONS.map((option) => (
              <SelectableChip
                key={option.label}
                label={option.label}
                selected={preferences.servings === option.value}
                onToggle={() =>
                  onChange({ ...preferences, servings: option.value })
                }
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Tipo di piatto
          </p>
          <div className="flex flex-wrap gap-2">
            {DISH_TYPE_OPTIONS.map((option) => (
              <SelectableChip
                key={option.value}
                label={option.label}
                selected={preferences.dishType === option.value}
                onToggle={() =>
                  onChange({ ...preferences, dishType: option.value })
                }
              />
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
