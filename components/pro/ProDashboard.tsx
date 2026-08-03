"use client";

import {
  ArrowRight,
  Check,
  FileText,
  Image as ImageIcon,
  PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildStats,
  buildSummary,
  DEMO_DIARY,
  DEMO_EXCHANGES,
  DEMO_PATIENT,
  DEMO_PLAN,
  DEMO_SOURCE_FILE,
  getInitials,
  type DemoOverrides,
  type DemoStepId,
} from "@/lib/proDemoData";

interface ProDashboardProps {
  step: DemoStepId;
  logged: boolean;
  overrides: DemoOverrides;
}

/**
 * Il lato professionista della demo.
 *
 * Registro grafico opposto al telefono: più denso, più aria, il berry usato
 * come accento e non come riempimento. Un professionista giudica in tre
 * secondi se un software è una cosa seria, e un'interfaccia consumer morbida
 * e colorata risponde di no.
 */
export function ProDashboard({ step, logged, overrides }: ProDashboardProps) {
  return (
    <div className="rounded-2xl bg-muted/40 p-4">
      <p className="pb-3 text-xs text-muted-foreground">Vista nutrizionista</p>

      <PatientHeader patientName={overrides.patientName} />

      {step === 1 && <PlanImport />}
      {step === 2 && <LiveTimeline logged={logged} />}
      {step === 3 && <FullReview overrides={overrides} />}
    </div>
  );
}

function PatientHeader({ patientName }: { patientName: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-primary">
        {getInitials(patientName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{patientName}</p>
        <p className="text-xs text-muted-foreground">
          {DEMO_PATIENT.since} · {DEMO_PATIENT.week}
        </p>
      </div>
    </div>
  );
}

/** Atto 1: il PDF che diventa struttura, e le equivalenze già definite. */
function PlanImport() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
        <FileText className="size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-foreground">
            {DEMO_SOURCE_FILE.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {DEMO_SOURCE_FILE.size} · {DEMO_SOURCE_FILE.pages} pagine
          </p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-accent" />
        <span className="shrink-0 text-xs text-accent">Letto</span>
      </div>

      <div className="rounded-xl border border-border bg-background">
        {DEMO_PLAN.map((meal, index) => (
          <div
            key={`${meal.time}-${meal.name}`}
            className={cn(
              "flex gap-3 px-3 py-2",
              index > 0 && "border-t border-border"
            )}
          >
            <span className="w-11 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
              {meal.time}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-foreground">{meal.name}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {meal.items.join(" · ")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background px-3 py-2.5">
        <p className="text-xs text-muted-foreground">
          Le tue equivalenze, definite una volta
        </p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {DEMO_EXCHANGES.map((exchange) => (
            <li key={exchange.from} className="text-xs leading-relaxed">
              <span className="text-foreground">{exchange.from}</span>
              <span className="text-muted-foreground"> → {exchange.to}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Atto 2: la cronologia che riceve il pasto nel momento in cui viene registrato. */
function LiveTimeline({ logged }: { logged: boolean }) {
  const liveEntry = DEMO_DIARY.find((entry) => entry.isLive);
  const rest = DEMO_DIARY.filter((entry) => !entry.isLive);

  return (
    <div className="flex flex-col gap-2">
      {logged && liveEntry ? (
        // L'unica animazione della pagina, e deve restare sobria: è
        // l'istante in cui il nutrizionista capisce il prodotto.
        <div className="animate-in fade-in-0 slide-in-from-top-2 rounded-xl border-2 border-accent bg-background p-3 duration-500">
          <div className="flex gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <ImageIcon className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {liveEntry.meal} · {liveEntry.recipe}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Registrata alle {liveEntry.loggedAt}
                {liveEntry.note ? ` · «${liveEntry.note}»` : ""}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2 border-t border-border pt-2.5">
            {/* La ricompensa che funziona non è un badge: è che una persona
                vera abbia guardato. Vedi PROGETTO_NUTRIZIONISTI.md §4.3. */}
            <span className="inline-flex cursor-default items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
              <PenLine className="size-3.5" />
              Scrivi due righe
            </span>
            <span className="inline-flex cursor-default items-center rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">
              Vedi il piano
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-3 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            In attesa. Registra il pasto sul telefono per vedere cosa succede
            qui.
          </p>
        </div>
      )}

      {rest.map((entry) => (
        <div
          key={entry.id}
          className="rounded-xl border border-border bg-background px-3 py-2.5"
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm text-foreground">
              {entry.meal} · {entry.recipe}
            </p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {entry.day} {entry.loggedAt}
            </span>
          </div>
          {entry.note && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              «{entry.note}»
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/** Atto 3: il riepilogo prima della visita e i tre numeri. */
function FullReview({ overrides }: { overrides: DemoOverrides }) {
  const stats = buildStats(overrides);
  const substitutions = overrides.substitutions;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-border bg-background px-3 py-3">
        <p className="text-xs text-muted-foreground">
          Riepilogo prima della visita
        </p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">
          {buildSummary(overrides)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-background px-3 py-2.5"
          >
            <p className="text-xs leading-tight text-muted-foreground">
              {stat.label}
            </p>
            <p
              className={cn(
                "mt-1 text-xl font-medium tabular-nums",
                stat.highlight ? "text-accent" : "text-foreground"
              )}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
        <Check className="mt-0.5 size-4 shrink-0 text-accent" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {substitutions === 1
            ? "La sostituzione è stata risolta dentro le tue regole. Non è arrivata a te."
            : `Le ${substitutions} sostituzioni sono state risolte dentro le tue regole. Nessuna è arrivata a te.`}
        </p>
      </div>
    </div>
  );
}
