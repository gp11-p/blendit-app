import { ShoppingBag } from "lucide-react";

interface PartnerProductsPreviewProps {
  ingredients: string[];
}

// Anteprima visiva soltanto: nessun acquisto reale, nessun partner B2B
// collegato. Mostra la direzione futura senza promettere una funzionalità
// che non esiste ancora (vedi CLAUDE.md).
export function PartnerProductsPreview({
  ingredients,
}: PartnerProductsPreviewProps) {
  if (ingredients.length === 0) return null;

  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4">
      <p className="mb-3 text-xs font-medium text-muted-foreground">
        🛍️ Completa la ricetta — presto in app
      </p>
      <div className="flex flex-col gap-2">
        {ingredients.map((ingredient) => (
          <div
            key={ingredient}
            className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{ingredient}</span>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              Presto disponibile
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        In arrivo: acquista gli ingredienti mancanti direttamente in app
        grazie ai nostri partner.
      </p>
    </div>
  );
}
