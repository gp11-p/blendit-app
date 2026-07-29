import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface IngredientInputProps {
  onAdd: (ingredient: string) => void;
}

export function IngredientInput({ onAdd }: IngredientInputProps) {
  const [value, setValue] = useState("");

  function handleAdd() {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onAdd(trimmed);
    setValue("");
  }

  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
        }}
        placeholder="Es. pomodori, uova, riso..."
        aria-label="Aggiungi ingrediente"
      />
      <Button type="button" onClick={handleAdd}>
        Aggiungi
      </Button>
    </div>
  );
}
