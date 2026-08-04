import { z } from "zod";

// Schema e prompt condivisi tra la demo di vendita (app/api/pro-demo-import)
// e la funzione consumer vera (app/api/nutrition-plan): stessa identica
// logica di interpretazione del documento, un solo posto da correggere se un
// domani un PDF non si legge bene.

const PlanItemSchema = z.object({
  food: z.string(),
  quantity: z.string(),
});

const MealSchema = z.object({
  name: z.string(),
  items: z.array(PlanItemSchema),
});

const DaySchema = z.object({
  day: z.string(),
  meals: z.array(MealSchema),
});

export const PlanImportSchema = z.object({
  recognized: z.boolean(),
  reason: z.string(),
  days: z.array(DaySchema),
});

export type PlanImportResult = z.infer<typeof PlanImportSchema>;
export type PlanDay = z.infer<typeof DaySchema>;
export type PlanMeal = z.infer<typeof MealSchema>;
export type PlanItem = z.infer<typeof PlanItemSchema>;

export const PLAN_IMPORT_SYSTEM_PROMPT = `Sei un assistente che trasforma un piano alimentare scritto da un nutrizionista (PDF o foto) in una struttura leggibile.

Regole:
- Ricostruisci i giorni, per ogni giorno i pasti, e per ogni pasto gli alimenti con la quantità esattamente come scritta nel documento (es. "80g", "1 porzione", "q.b."). Non convertire unità e non inventare quantità assenti.
- Non aggiungere alimenti, pasti o giorni che non sono nel documento.
- Se il documento è davvero un piano alimentare leggibile, restituisci recognized: true, reason: stringa vuota, days valorizzato.
- Se il documento NON è un piano alimentare leggibile (altro tipo di documento, scansione illeggibile, file vuoto, contenuto che non è un piano pasti), restituisci recognized: false, un reason breve e onesto in italiano che spiega perché, e days come array vuoto. In questo caso NON inventare una struttura plausibile: un'importazione sbagliata ma credibile è peggio di un errore dichiarato.`;

export const PLAN_IMPORT_VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

// ~10.7 milioni di caratteri base64 ≈ 8MB di file originale: generoso per un
// piano in PDF o una foto, ma pur sempre un tetto.
export const MAX_PLAN_FILE_BASE64_LENGTH = 10_700_000;

/** Il content block Anthropic per il file caricato (documento o immagine). */
export function buildPlanFileContentBlock(file: string, mediaType: unknown) {
  if (mediaType === "application/pdf") {
    return {
      type: "document" as const,
      source: {
        type: "base64" as const,
        media_type: "application/pdf" as const,
        data: file,
      },
    };
  }

  const resolvedImageType =
    typeof mediaType === "string" &&
    (PLAN_IMPORT_VALID_IMAGE_TYPES as readonly string[]).includes(mediaType)
      ? (mediaType as (typeof PLAN_IMPORT_VALID_IMAGE_TYPES)[number])
      : "image/jpeg";

  return {
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: resolvedImageType,
      data: file,
    },
  };
}
