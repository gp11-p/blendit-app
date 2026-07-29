"use client";

import { useRef, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoInputProps {
  onIngredientsFound: (ingredients: string[]) => void;
}

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_DIMENSION = 1600;

async function compressImage(
  file: File
): Promise<{ base64: string; mediaType: string }> {
  if (file.size <= MAX_BYTES) {
    return { base64: await fileToBase64(file), mediaType: file.type || "image/jpeg" };
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non supportato.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.8)
  );
  if (!blob) throw new Error("Compressione dell'immagine fallita.");

  return { base64: await fileToBase64(blob), mediaType: "image/jpeg" };
}

function fileToBase64(file: Blob): Promise<string> {
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

export function PhotoInput({ onIngredientsFound }: PhotoInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPreviewUrl(null);
    setError(null);
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setLoading(true);

    try {
      const { base64, mediaType } = await compressImage(file);

      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Errore sconosciuto.");
      }

      const ingredients: string[] = Array.isArray(data.ingredients)
        ? data.ingredients
        : [];

      if (ingredients.length === 0) {
        setError(
          "Hmm, non vedo ingredienti chiari. Prova ancora o inseriscili a mano."
        );
      } else {
        onIngredientsFound(ingredients);
        setPreviewUrl(null);
      }
    } catch {
      setError("Non sono riuscito ad analizzare la foto. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {!previewUrl && (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          📷 Fotografa il frigo
        </Button>
      )}

      {previewUrl && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Anteprima frigo"
            className="max-h-48 w-full rounded-xl object-cover"
          />

          {loading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Sto guardando cosa c&apos;è...
            </p>
          )}

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            disabled={loading}
          >
            <RotateCcw className="size-4" />
            Riprova
          </Button>
        </div>
      )}
    </div>
  );
}
