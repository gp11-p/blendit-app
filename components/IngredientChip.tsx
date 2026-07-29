interface IngredientChipProps {
  label: string;
  onRemove: () => void;
}

export function IngredientChip({ label, onRemove }: IngredientChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm text-foreground">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Rimuovi ${label}`}
        className="text-muted-foreground hover:text-destructive"
      >
        ×
      </button>
    </span>
  );
}
