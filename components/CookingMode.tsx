"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import type { Recipe } from "@/lib/types";

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
}

// Cattura tempi tipo "10 minuti", "10 min", "1 minuto" dentro il testo di un
// passo. Non prova a capire ore ("1 ora"): raro in una ricetta veloce da
// frigo, e avrebbe complicato la regex per un caso marginale.
const DURATION_PATTERN = /(\d+)\s*(?:minuti|minuto|min)\b/i;

function extractMinutes(step: string): number | null {
  const match = step.match(DURATION_PATTERN);
  if (!match) return null;
  const minutes = Number(match[1]);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Schermata a tutto schermo, un passo alla volta, pensata per essere usata
 * mentre si cucina (mani sporche, telefono lontano, schermo che non deve
 * spegnersi). È il differenziatore più difendibile del prodotto: sposta
 * Blendit da "generatore di ricette" (lo fa chiunque) a "compagno mentre
 * cucini davvero".
 */
export function CookingMode({ recipe, onClose }: CookingModeProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const totalSteps = recipe.steps.length;
  const currentStep = recipe.steps[stepIndex];
  const isLastStep = stepIndex === totalSteps - 1;
  const timerMinutes = extractMinutes(currentStep);

  useEffect(() => {
    track("cooking_mode_started", { recipe: recipe.title.slice(0, 60) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Screen Wake Lock: lo schermo resta acceso finché sei in modalità cucina.
  // Il browser rilascia da solo il lock quando la scheda va in background
  // (es. cambi app per rispondere a un messaggio): lo richiediamo di nuovo
  // quando torni visibile, così l'effetto resta attivo per tutta la sessione
  // di cucina, non solo dal primo passo.
  useEffect(() => {
    let cancelled = false;

    async function requestWakeLock() {
      if (!("wakeLock" in navigator)) return; // Safari vecchi: nessun errore, solo niente lock.
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          void lock.release();
          return;
        }
        wakeLockRef.current = lock;
      } catch {
        // Negato o non supportato in questo contesto: la modalità cucina
        // resta comunque utilizzabile, solo senza tenere lo schermo acceso.
      }
    }

    void requestWakeLock();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void requestWakeLock();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, []);

  // Countdown del timer, un secondo alla volta mentre è avviato.
  useEffect(() => {
    if (!timerRunning || secondsLeft === null || secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(id);
  }, [timerRunning, secondsLeft]);

  function goToStep(nextIndex: number) {
    setStepIndex(nextIndex);
    setSecondsLeft(null);
    setTimerRunning(false);
  }

  function handleNext() {
    if (isLastStep) {
      track("cooking_mode_completed", { recipe: recipe.title.slice(0, 60) });
      onClose();
      return;
    }
    goToStep(stepIndex + 1);
  }

  function startTimer() {
    if (timerMinutes === null) return;
    setSecondsLeft(timerMinutes * 60);
    setTimerRunning(true);
  }

  // Portale su document.body: un antenato qualunque con un transform CSS
  // (anche innocuo, come il residuo delle classi animate-in di Tailwind su
  // RecipeCard) intrappola un discendente "fixed" dentro il proprio riquadro
  // invece di farlo coprire tutto lo schermo. Il portale evita il problema a
  // monte, indipendentemente da dove verrà montato questo componente in
  // futuro.
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          Passo {stepIndex + 1} di {totalSteps}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Esci dalla modalità cucina"
        >
          <X className="size-5" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-4 text-center">
        <p className="font-heading text-3xl leading-snug text-foreground">
          {currentStep}
        </p>

        {timerMinutes !== null && (
          <div className="flex flex-col items-center gap-2">
            {secondsLeft === null ? (
              <Button type="button" variant="outline" size="lg" onClick={startTimer}>
                <Play className="size-4" />
                Avvia timer {timerMinutes} min
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span
                  aria-live="polite"
                  className={`font-heading text-4xl tabular-nums ${
                    secondsLeft === 0 ? "text-accent" : "text-foreground"
                  }`}
                >
                  {secondsLeft === 0 ? "Fatto!" : formatSeconds(secondsLeft)}
                </span>
                {secondsLeft > 0 && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setTimerRunning((running) => !running)}
                    >
                      {timerRunning ? (
                        <Pause className="size-4" />
                      ) : (
                        <Play className="size-4" />
                      )}
                      {timerRunning ? "Pausa" : "Riprendi"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSecondsLeft(null);
                        setTimerRunning(false);
                      }}
                    >
                      <RotateCcw className="size-4" />
                      Azzera
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-6 py-6">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={stepIndex === 0}
          onClick={() => goToStep(stepIndex - 1)}
          className="flex-1"
        >
          Indietro
        </Button>
        <Button type="button" size="lg" onClick={handleNext} className="flex-1">
          {isLastStep ? "Fine" : "Avanti"}
        </Button>
      </div>
    </div>,
    document.body
  );
}
