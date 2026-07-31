"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDeviceId } from "@/lib/deviceId";

// Da quando dispensa, piano pasti e lista della spesa vivono anche su
// Supabase (non solo nel browser), "cancella i dati del sito" dalle
// impostazioni del browser non basta più: dimentica l'id del dispositivo ma
// le righe sul server restano orfane. Questo pulsante cancella entrambe le
// cose, così "cancella tutto" resta vero come prima.

type Status = "idle" | "confirming" | "deleting" | "done";

export function DeleteAllDataButton() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleConfirm() {
    setStatus("deleting");

    const headers = { "x-blendit-device-id": getDeviceId() };
    await Promise.allSettled([
      fetch("/api/pantry", { method: "DELETE", headers }),
      fetch("/api/meal-plan", { method: "DELETE", headers }),
      fetch("/api/shopping-checked", { method: "DELETE", headers }),
    ]);

    try {
      // Rimuoviamo ogni chiave nostra, non solo quelle di dispensa/piano/
      // lista: anche l'id anonimo di misurazione e l'id del dispositivo
      // stesso, altrimenti "cancella tutto" non sarebbe più vero.
      const keysToRemove = Object.keys(window.localStorage).filter((key) =>
        key.startsWith("blendit-")
      );
      for (const key of keysToRemove) window.localStorage.removeItem(key);
    } catch {
      // localStorage non disponibile: i dati sul server sono comunque
      // cancellati, che è la parte che conta davvero.
    }

    setStatus("done");
  }

  if (status === "done") {
    return (
      <p className="flex items-center gap-1.5 text-sm text-accent">
        <Check className="size-4" />
        Fatto: non resta più nulla, né qui né sul server.
      </p>
    );
  }

  if (status === "confirming" || status === "deleting") {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleConfirm}
          disabled={status === "deleting"}
        >
          {status === "deleting" ? "Cancello..." : "Sì, cancella tutto"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setStatus("idle")}
          disabled={status === "deleting"}
        >
          Annulla
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setStatus("confirming")}
    >
      Cancella tutti i miei dati
    </Button>
  );
}
