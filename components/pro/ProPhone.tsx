"use client";

import { Camera, Check, Clock, MessageCircleQuestion } from "lucide-react";
import { ProPlanChat } from "@/components/pro/ProPlanChat";
import { cn } from "@/lib/utils";
import {
  DEMO_PLAN,
  DEMO_RECIPE,
  DEMO_SUBSTITUTION,
  type DemoOverrides,
  type DemoStepId,
} from "@/lib/proDemoData";

interface ProPhoneProps {
  step: DemoStepId;
  stepIndex: number;
  onStepIndexChange: (index: number) => void;
  /** true dopo che nella demo è stato registrato il pasto. */
  logged: boolean;
  /** true dopo che nella demo si è scelto di saltare, senza registrare nulla. */
  skipped: boolean;
  onLogMeal: () => void;
  onSkipMeal: () => void;
  /** La nota scritta dal nutrizionista nel cruscotto, se già inviata. */
  nutritionistNote: string | null;
  overrides: DemoOverrides;
}

/**
 * Il lato paziente della demo: quello che si vede sul telefono.
 *
 * Registro grafico volutamente diverso dal cruscotto — caldo, arrotondato,
 * testo grande, una colonna sola. È il contrasto con il lato professionista
 * che fa capire in un colpo d'occhio che sono due mondi collegati, non la
 * stessa schermata.
 *
 * La cornice è un rettangolo arrotondato con un bordo sottile: niente finte
 * scocche di iPhone con la tacca, sembrano scadenti e datano la demo.
 */
export function ProPhone({
  step,
  stepIndex,
  onStepIndexChange,
  logged,
  skipped,
  onLogMeal,
  onSkipMeal,
  nutritionistNote,
  overrides,
}: ProPhoneProps) {
  return (
    <div className="rounded-3xl bg-muted/50 p-3">
      <p className="pb-2 text-center text-xs text-muted-foreground">
        Vista paziente
      </p>
      <div className="min-h-[360px] rounded-2xl border border-border bg-background p-4">
        {step === 1 && <PlanScreen nutritionistName={overrides.nutritionistName} />}
        {step === 2 && (
          <CookingScreen
            stepIndex={stepIndex}
            onStepIndexChange={onStepIndexChange}
            logged={logged}
            skipped={skipped}
            onLogMeal={onLogMeal}
            onSkipMeal={onSkipMeal}
            nutritionistNote={nutritionistNote}
            nutritionistName={overrides.nutritionistName}
          />
        )}
        {step === 3 && <SubstitutionScreen nutritionistName={overrides.nutritionistName} />}
      </div>
    </div>
  );
}

/** Atto 1: il piano della dottoressa, come lo vede il paziente. */
function PlanScreen({ nutritionistName }: { nutritionistName: string }) {
  return (
    <div>
      <h3 className="font-heading text-xl font-bold text-foreground">
        Il tuo piano di oggi
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Impostato da {nutritionistName}
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {DEMO_PLAN.map((meal) => (
          <li key={`${meal.time}-${meal.name}`}>
            <div className="flex items-baseline gap-2">
              <span className="text-xs tabular-nums text-muted-foreground">
                {meal.time}
              </span>
              <span className="text-sm font-medium text-foreground">
                {meal.name}
              </span>
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
              {meal.items.join(" · ")}
            </p>
          </li>
        ))}
      </ul>

      <ProPlanChat />
    </div>
  );
}

/** Atto 2: "cuciniamo insieme", e la registrazione facoltativa del pasto. */
function CookingScreen({
  stepIndex,
  onStepIndexChange,
  logged,
  skipped,
  onLogMeal,
  onSkipMeal,
  nutritionistNote,
  nutritionistName,
}: {
  stepIndex: number;
  onStepIndexChange: (index: number) => void;
  logged: boolean;
  skipped: boolean;
  onLogMeal: () => void;
  onSkipMeal: () => void;
  nutritionistNote: string | null;
  nutritionistName: string;
}) {
  const total = DEMO_RECIPE.steps.length;
  const isLastStep = stepIndex === total - 1;

  return (
    <div>
      <p className="text-xs text-muted-foreground">
        Passo {stepIndex + 1} di {total}
      </p>
      <div className="mt-2 flex gap-1">
        {DEMO_RECIPE.steps.map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full",
              index <= stepIndex ? "bg-primary" : "bg-border"
            )}
          />
        ))}
      </div>

      <p className="mt-4 text-lg leading-relaxed text-foreground">
        {DEMO_RECIPE.steps[stepIndex]}
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
        <Clock className="size-4 text-primary" />
        <span className="text-sm text-foreground">{DEMO_RECIPE.timerLabel}</span>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        {!isLastStep ? (
          // Stesso pattern Indietro/Avanti della modalità cucina vera
          // (components/CookingMode.tsx): la demo deve comportarsi come il
          // prodotto, non solo assomigliargli.
          <div className="flex gap-2">
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => onStepIndexChange(stepIndex - 1)}
              className="flex-1 cursor-pointer rounded-full border border-border px-3 py-2 text-sm text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Indietro
            </button>
            <button
              type="button"
              onClick={() => onStepIndexChange(stepIndex + 1)}
              className="flex-1 cursor-pointer rounded-full bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              Avanti
            </button>
          </div>
        ) : logged ? (
          <div>
            <p className="flex items-center gap-2 text-sm text-accent">
              <Check className="size-4" />
              Registrato. {nutritionistName} lo vedrà.
            </p>
            {nutritionistNote && (
              <div className="animate-in fade-in-0 slide-in-from-top-1 mt-3 rounded-xl bg-muted px-3 py-2.5 duration-500">
                <p className="text-xs text-muted-foreground">{nutritionistName}</p>
                <p className="mt-0.5 text-sm text-foreground">«{nutritionistNote}»</p>
              </div>
            )}
          </div>
        ) : skipped ? (
          // Nessuna frase che faccia sentire in colpa, anche qui: è una
          // regola di prodotto, non un dettaglio della demo. Vedi
          // PROGETTO_NUTRIZIONISTI.md §2.3.
          <p className="text-sm text-muted-foreground">
            Va bene così, nessun obbligo.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Com&apos;è andata?</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={onLogMeal}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
              >
                <Camera className="size-4" />
                Foto
              </button>
              {/* Saltare costa un tocco e il testo non fa sentire in colpa:
                  è una regola, non una preferenza. Vedi
                  PROGETTO_NUTRIZIONISTI.md §2.3. */}
              <button
                type="button"
                onClick={onSkipMeal}
                className="flex-1 cursor-pointer rounded-full border border-border px-3 py-2 text-sm text-muted-foreground"
              >
                Salta
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Atto 3: la domanda delle 21, risolta senza disturbare la dottoressa. */
function SubstitutionScreen({ nutritionistName }: { nutritionistName: string }) {
  return (
    <div>
      <h3 className="font-heading text-xl font-bold text-foreground">
        Non ce l&apos;ho
      </h3>

      <div className="mt-4 flex flex-col gap-3">
        <div className="ml-6 rounded-2xl rounded-br-sm bg-muted px-4 py-3">
          <p className="text-sm text-foreground">
            {DEMO_SUBSTITUTION.question}
          </p>
        </div>

        <div className="mr-6 rounded-2xl rounded-bl-sm bg-primary px-4 py-3">
          <p className="text-sm leading-relaxed text-primary-foreground">
            {DEMO_SUBSTITUTION.answer}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border px-3 py-2.5">
        <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Regola impostata da {nutritionistName}. Nessun messaggio inviato.
        </p>
      </div>
    </div>
  );
}
