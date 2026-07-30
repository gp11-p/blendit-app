"use client";

import { Button } from "@/components/ui/button";
import { PantryChip } from "@/components/PantryChip";
import type { PantryItem } from "@/lib/usePantry";

interface PantryPanelProps {
  items: PantryItem[];
  onToggle: (name: string) => void;
  onRemove: (name: string) => void;
  onSetAllSelected: (selected: boolean) => void;
}

/**
 * La dispensa: quello che hai in casa, che resta salvato tra una visita e
 * l'altra.
 *
 * I chip accesi entrano nella prossima ricetta; quelli spenti restano in
 * dispensa ma vengono ignorati. Questa distinzione serve a un caso concreto:
 * hai 20 cose in casa ma stasera vuoi cucinare solo con le 4 che stanno per
 * scadere, senza dover cancellare (e poi ridigitare) tutto il resto.
 */
export function PantryPanel({
  items,
  onToggle,
  onRemove,
  onSetAllSelected,
}: PantryPanelProps) {
  if (items.length === 0) return null;

  const selectedCount = items.filter((item) => item.selected).length;
  const allSelected = selectedCount === items.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-foreground">
          La mia dispensa{" "}
          <span className="font-normal text-muted-foreground">
            ({selectedCount} su {items.length} in uso)
          </span>
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onSetAllSelected(!allSelected)}
          className="h-auto px-2 py-1 text-xs text-muted-foreground"
        >
          {allSelected ? "Deseleziona tutto" : "Usa tutto"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <PantryChip
            key={item.name}
            label={item.name}
            selected={item.selected}
            onToggle={() => onToggle(item.name)}
            onRemove={() => onRemove(item.name)}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Tocca un ingrediente per escluderlo da questa ricetta senza toglierlo
        dalla dispensa. La dispensa resta salvata su questo dispositivo.
      </p>
    </div>
  );
}
