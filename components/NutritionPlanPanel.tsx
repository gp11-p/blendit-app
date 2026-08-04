"use client";

import { useRef, useState } from "react";
import { ChevronDown, Loader2, Trash2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { PlanDay, PlanItem } from "@/lib/planImport";

interface NutritionPlanPanelProps {
  days: PlanDay[];
  loaded: boolean;
  importing: boolean;
  /** true mentre si genera una ricetta per un pasto del piano. */
  generatingRecipe: boolean;
  onImport: (file: string, mediaType: string) => Promise<{
    recognized: boolean;
    reason: string;
  }>;
  onClear: () => void;
  onGenerateRecipe: (mealName: string, items: PlanItem[]) => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Lettura del file fallita."));
        return;
      }
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Lettura del file fallita."));
    reader.readAsDataURL(file);
  });
}

// 8MB: stesso tetto lato client di lib/planImport.ts (MAX_PLAN_FILE_BASE64_LENGTH).
const MAX_FILE_BYTES = 8 * 1024 * 1024;

/**
 * Il piano nutrizionale importato dal proprio nutrizionista: si carica un
 * PDF o una foto, l'AI lo struttura e lo salva (in modo anonimo per
 * dispositivo, come dispensa e piano pasti). Da qui si genera una ricetta
 * Blendit per uno specifico pasto del piano, privilegiando quello che è già
 * in dispensa — vedi app/api/plan-recipe/route.ts.
 */
export function NutritionPlanPanel({
  days,
  loaded,
  importing,
  generatingRecipe,
  onImport,
  onClear,
  onGenerateRecipe,
}: NutritionPlanPanelProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = "";

    if (file.size > MAX_FILE_BYTES) {
      setError("Il file è troppo grande (max 8MB). Riprova con un file più leggero.");
      return;
    }

    setError(null);
    try {
      const base64 = await fileToBase64(file);
      const mediaType = file.type || "application/pdf";
      const result = await onImport(base64, mediaType);

      if (!result.recognized) {
        setError(result.reason || "Non sono riuscito a leggere un piano in questo file.");
        return;
      }
      track("nutrition_plan_imported");
    } catch {
      setError("Non sono riuscito a leggere il file. Riprova.");
    }
  }

  if (!loaded) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium text-foreground">
        📋 Il piano del nutrizionista{days.length > 0 ? ` (${days.length} giorni)` : ""}
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 pt-4">
        {days.length === 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Carica il piano che ti ha scritto il tuo nutrizionista (PDF o
              foto): Blendit lo trasforma in ricette usando quello che hai
              già in dispensa, per spendere meno e buttare meno cibo.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              disabled={importing}
              onClick={() => inputRef.current?.click()}
              className="self-start"
            >
              {importing && <Loader2 className="size-4 animate-spin" />}
              {importing ? "Sto leggendo il piano..." : "Carica il tuo piano"}
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {days.map((day) => (
                <div key={day.day}>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    {day.day}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {day.meals.map((meal, index) => (
                      <li
                        key={`${day.day}-${meal.name}-${index}`}
                        className="rounded-lg bg-muted px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {meal.name}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            disabled={generatingRecipe}
                            onClick={() => onGenerateRecipe(meal.name, meal.items)}
                          >
                            Genera ricetta
                          </Button>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {meal.items
                            .map((item) => `${item.food} (${item.quantity})`)
                            .join(" · ")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={importing}
                onClick={() => inputRef.current?.click()}
              >
                {importing ? "Sto leggendo il piano..." : "Importa un altro piano"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-muted-foreground"
              >
                <Trash2 className="size-3.5" />
                Rimuovi piano
              </Button>
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CollapsibleContent>
    </Collapsible>
  );
}
