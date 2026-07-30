import { cn } from "@/lib/utils";

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export function SelectableChip({
  label,
  selected,
  onToggle,
}: SelectableChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}
