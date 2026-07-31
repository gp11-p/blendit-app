"use client";

import { Button } from "@/components/ui/button";
import { PantryChip } from "@/components/PantryChip";
import type { PantryItem } from "@/lib/usePantry";

interface PantryPanelProps {
  items: PantryItem[];
  onToggle: (name: string) => void;
  onRemove: (name: string) => void;
  onQuantityChange: (name: string, delta: number) => void;
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
  onQuantityChange,
  onSetAllSelected,
}: PantryPanelProps) {
  if (items.length === 0) return null;

  const selectedCount = items.filter((item) => item.selected).length;
  // Un ingrediente tracciato a quota zero non è mai "selezionabile": va
  // escluso dal denominatore, altrimenti il pulsante resterebbe bloccato su
  // "Usa tutto" anche a dispensa piena.
  const selectableCount = items.filter((item) => item.quantity !== 0).length;
  const allSelected = selectableCount > 0 && selectedCount === selectableCount;

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
            quantity={item.quantity}
            onToggle={() => onToggle(item.name)}
            onRemove={() => onRemove(item.name)}
            onQuantityChange={(delta) => onQuantityChange(item.name, delta)}
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
