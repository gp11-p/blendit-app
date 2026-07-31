import { cn } from "@/lib/utils";

interface PantryChipProps {
  label: string;
  /** Se true, l'ingrediente viene usato per la prossima ricetta. */
  selected: boolean;
  /** Conteggio tracciato (uova, zucchine...). null = non tracciato. */
  quantity: number | null;
  onToggle: () => void;
  onRemove: () => void;
  /** +1 o -1: il valore assoluto lo calcola l'hook, mai questo componente. */
  onQuantityChange: (delta: number) => void;
}

/** Stile condiviso dai piccoli pulsanti circolari (×, −, +). */
const glyphButtonClass =
  "flex size-5 cursor-pointer items-center justify-center rounded-full text-base leading-none transition-colors";

/**
 * Chip della dispensa: si può disattivare (resta in dispensa ma non entra
 * nella ricetta), eliminare del tutto, oppure tracciare/aggiustare una
 * quantità (solo per ingredienti che si contano a pezzi - uova, zucchine...).
 *
 * Sono <button> affiancati dentro uno <span>, non annidati: annidare bottoni
 * è HTML non valido e rompe la navigazione da tastiera e i lettori di schermo.
 */
export function PantryChip({
  label,
  selected,
  quantity,
  onToggle,
  onRemove,
  onQuantityChange,
}: PantryChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border py-1 pl-3 pr-1.5 text-sm transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={
          selected
            ? `Non usare ${label} in questa ricetta`
            : `Usa ${label} in questa ricetta`
        }
        className="cursor-pointer"
      >
        {label}
      </button>

      {quantity !== null && (
        <button
          type="button"
          onClick={() => onQuantityChange(-1)}
          disabled={quantity === 0}
          aria-label={`Diminuisci quantità di ${label}`}
          className={cn(
            glyphButtonClass,
            "disabled:cursor-not-allowed disabled:opacity-40",
            selected
              ? "hover:bg-primary-foreground/20"
              : "hover:bg-muted hover:text-destructive"
          )}
        >
          −
        </button>
      )}

      {quantity !== null && (
        <span aria-live="polite" className="text-sm tabular-nums">
          {quantity}
        </span>
      )}

      <button
        type="button"
        onClick={() => onQuantityChange(1)}
        aria-label={
          quantity === null
            ? `Traccia una quantità per ${label}`
            : `Aumenta quantità di ${label}`
        }
        className={cn(
          glyphButtonClass,
          quantity === null && "opacity-60",
          selected
            ? "hover:bg-primary-foreground/20"
            : "hover:bg-muted hover:text-destructive"
        )}
      >
        +
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Togli ${label} dalla dispensa`}
        className={cn(
          glyphButtonClass,
          selected
            ? "hover:bg-primary-foreground/20"
            : "hover:bg-muted hover:text-destructive"
        )}
      >
        ×
      </button>
    </span>
  );
}
