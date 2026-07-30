import { cn } from "@/lib/utils";

interface PantryChipProps {
  label: string;
  /** Se true, l'ingrediente viene usato per la prossima ricetta. */
  selected: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

/**
 * Chip della dispensa: si può disattivare (resta in dispensa ma non entra
 * nella ricetta) oppure eliminare del tutto.
 *
 * Sono due <button> affiancati dentro uno <span>, non un bottone dentro un
 * altro: annidare bottoni è HTML non valido e rompe la navigazione da
 * tastiera e i lettori di schermo.
 */
export function PantryChip({
  label,
  selected,
  onToggle,
  onRemove,
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
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Togli ${label} dalla dispensa`}
        className={cn(
          "flex size-5 cursor-pointer items-center justify-center rounded-full text-base leading-none transition-colors",
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
