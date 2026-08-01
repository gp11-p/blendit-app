import { Input } from "@/components/ui/input";

interface CravingInputProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_LENGTH = 120;

/**
 * Campo libero e sempre visibile (non dentro "Personalizza"): l'obiettivo è
 * dare ispirazione, quindi deve essere facile da trovare, non un'opzione
 * avanzata da scoprire. Facoltativo - lasciarlo vuoto si comporta esattamente
 * come prima.
 */
export function CravingInput({ value, onChange }: CravingInputProps) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Di cosa hai voglia? Es. leggero, comfort food, piccante... (opzionale)"
      aria-label="Di cosa hai voglia?"
      maxLength={MAX_LENGTH}
    />
  );
}
