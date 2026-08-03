"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlanItem {
  food: string;
  quantity: string;
}

interface PlanMeal {
  name: string;
  items: PlanItem[];
}

interface PlanDay {
  day: string;
  meals: PlanMeal[];
}

interface ImportResult {
  recognized: boolean;
  reason: string;
  days: PlanDay[];
}

// 8MB: generoso per un piano alimentare in PDF o una foto, ma pur sempre un
// tetto — deve combaciare con MAX_FILE_BASE64_LENGTH lato server.
const MAX_FILE_BYTES = 8 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Lettura del file fallita."));
        return;
      }
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Lettura del file fallita."));
    reader.readAsDataURL(file);
  });
}

type Status = "idle" | "loading" | "error";

/**
 * Lo strumento della Fase 0.3: carichi un piano alimentare vero (PDF o foto)
 * e vedi come Blendit lo strutturerebbe. Non è il prodotto, è quello che
 * cambia la conversazione in un'intervista — vedi PROGETTO_NUTRIZIONISTI.md §5.
 *
 * Nessun salvataggio: il file va al server solo per la durata della chiamata
 * AI e non viene scritto da nessuna parte, né qui né lì.
 */
export function ProImportDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function reset() {
    setStatus("idle");
    setFileName(null);
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      setError("Il file è troppo grande (max 8MB). Riprova con un file più leggero.");
      return;
    }

    setFileName(file.name);
    setResult(null);
    setError(null);
    setStatus("loading");

    try {
      const base64 = await fileToBase64(file);
      const mediaType = file.type || "application/pdf";

      const res = await fetch("/api/pro-demo-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64, mediaType }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Errore sconosciuto.");
      }

      setResult(data as ImportResult);
      setStatus("idle");
    } catch {
      setError("Non sono riuscito a leggere il file. Riprova.");
      setStatus("idle");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
        Il file non viene salvato: viene letto per questa analisi e poi
        scartato, non resta da nessuna parte.
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {!result && status !== "loading" && (
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="self-start"
        >
          <FileText className="size-4" />
          Carica un piano (PDF o foto)
        </Button>
      )}

      {status === "loading" && (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Sto leggendo {fileName}...
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          {result.recognized ? (
            <PlanResult days={result.days} />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground">
                Non sono riuscito a leggere un piano alimentare in questo file.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.reason}
              </p>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            className="self-start"
          >
            <RotateCcw className="size-4" />
            Analizza un altro file
          </Button>
        </div>
      )}
    </div>
  );
}

function PlanResult({ days }: { days: PlanDay[] }) {
  if (days.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Il file è stato letto ma non contiene giorni da mostrare.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {days.map((day) => (
        <div
          key={day.day}
          className="rounded-2xl bg-muted/40 p-4"
        >
          <p className="text-sm font-medium text-foreground">{day.day}</p>
          <div className="mt-3 flex flex-col gap-3">
            {day.meals.map((meal, mealIndex) => (
              <div key={`${day.day}-${meal.name}-${mealIndex}`}>
                <p className="text-xs font-medium text-primary">
                  {meal.name}
                </p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {meal.items.map((item, itemIndex) => (
                    <li
                      key={`${item.food}-${itemIndex}`}
                      className="flex items-baseline justify-between gap-2 text-sm text-foreground"
                    >
                      <span>{item.food}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
