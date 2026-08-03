"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProDashboard } from "@/components/pro/ProDashboard";
import { ProPersonalizePanel } from "@/components/pro/ProPersonalizePanel";
import { ProPhone } from "@/components/pro/ProPhone";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  DEFAULT_OVERRIDES,
  DEMO_NUTRITIONIST,
  DEMO_STEPS,
  type DemoOverrides,
  type DemoStepId,
} from "@/lib/proDemoData";

type View = "patient" | "dashboard";

const OVERRIDE_PARAMS: Record<keyof DemoOverrides, string> = {
  nutritionistName: "nutrizionista",
  patientName: "paziente",
  mealsLogged: "pasti",
  mealsTotal: "pastiTotali",
  substitutions: "sostituzioni",
};

function readOverridesFromParams(params: URLSearchParams): DemoOverrides {
  const nutritionistName =
    params.get(OVERRIDE_PARAMS.nutritionistName) ?? DEFAULT_OVERRIDES.nutritionistName;
  const patientName =
    params.get(OVERRIDE_PARAMS.patientName) ?? DEFAULT_OVERRIDES.patientName;
  const mealsLogged = parsePositiveInt(
    params.get(OVERRIDE_PARAMS.mealsLogged),
    DEFAULT_OVERRIDES.mealsLogged
  );
  const mealsTotal = parsePositiveInt(
    params.get(OVERRIDE_PARAMS.mealsTotal),
    DEFAULT_OVERRIDES.mealsTotal
  );
  const substitutions = parsePositiveInt(
    params.get(OVERRIDE_PARAMS.substitutions),
    DEFAULT_OVERRIDES.substitutions
  );
  return { nutritionistName, patientName, mealsLogged, mealsTotal, substitutions };
}

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
}

/**
 * La demo di Blendit Pro: lo strumento con cui si mostra il prodotto a un
 * nutrizionista, di persona o mandato come link.
 *
 * Non è una funzione dell'app: è la vendita. Per questo è tutta statica —
 * nessun account, nessun salvataggio, nessuna chiamata all'AI.
 *
 * Le due viste stanno AFFIANCATE sopra i 900px, perché la cosa che si vende
 * non è l'app del paziente né il cruscotto, ma il collegamento tra i due: se
 * bisogna cambiare schermata e ricordarsi cosa si è visto prima, il
 * collegamento resta nella testa di chi guarda e non convince.
 *
 * Sotto i 900px lo spazio non basta, e solo lì compare il selettore.
 */
export function ProDemo() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<DemoStepId>(1);
  const [view, setView] = useState<View>("patient");
  const [logged, setLogged] = useState(false);
  const [overrides, setOverridesState] = useState<DemoOverrides>(() =>
    readOverridesFromParams(searchParams)
  );

  const activeStep = DEMO_STEPS.find((s) => s.id === step) ?? DEMO_STEPS[0];
  const isCustomized =
    JSON.stringify(overrides) !== JSON.stringify(DEFAULT_OVERRIDES);

  const setOverrides = useCallback(
    (next: DemoOverrides) => {
      setOverridesState(next);
      const params = new URLSearchParams(searchParams.toString());
      (Object.keys(OVERRIDE_PARAMS) as (keyof DemoOverrides)[]).forEach((key) => {
        const param = OVERRIDE_PARAMS[key];
        if (next[key] === DEFAULT_OVERRIDES[key]) {
          params.delete(param);
        } else {
          params.set(param, String(next[key]));
        }
      });
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  function handleStep(next: DemoStepId) {
    setStep(next);
    // Ogni atto si apre dal lato in cui inizia la storia: l'atto 1 parte dal
    // cruscotto (il nutrizionista carica), gli altri due dal telefono.
    setView(next === 1 ? "dashboard" : "patient");
    track("pro_demo_step", { step: next });
  }

  function handleLogMeal() {
    setLogged(true);
    // Su schermo stretto il cruscotto non è visibile: portiamoci sopra, o il
    // momento chiave della demo passerebbe inosservato. Su schermo largo la
    // vista sono comunque entrambe, quindi questo non cambia nulla.
    setView("dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-heading text-2xl font-bold text-foreground">
            Blendit <span className="text-primary">Pro</span>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Per {DEMO_NUTRITIONIST.role.toLowerCase()} e dietisti
          </p>
        </div>
        {/* Sempre visibile, mai nascosta: se si scopre dopo che i dati erano
            finti ma sembravano reali, si perde la vendita e la fiducia. */}
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          Demo · dati di esempio
        </span>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Passi della demo">
        {DEMO_STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => handleStep(s.id)}
            aria-current={s.id === step ? "step" : undefined}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-1.5 text-sm transition-colors",
              s.id === step
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {s.id} · {s.label}
          </button>
        ))}
      </nav>

      {/* Ogni atto ha la sua riga di testo: la demo deve funzionare anche
          mandata come link, senza nessuno che la spieghi a voce. */}
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        {activeStep.intro}
      </p>

      <div className="mt-4 max-w-md">
        <ProPersonalizePanel
          overrides={overrides}
          isCustomized={isCustomized}
          onChange={setOverrides}
          onReset={() => setOverrides(DEFAULT_OVERRIDES)}
        />
      </div>

      <div className="mt-5 flex gap-1 rounded-full bg-muted p-1 min-[900px]:hidden">
        <ViewTab
          label="Vista paziente"
          active={view === "patient"}
          onClick={() => setView("patient")}
        />
        <ViewTab
          label="Vista nutrizionista"
          active={view === "dashboard"}
          onClick={() => setView("dashboard")}
        />
      </div>

      {/* Il passaggio da due colonne a una è fatto in CSS, non con
          JavaScript: evita il salto visivo al primo caricamento e non
          rischia disallineamenti tra server e browser. */}
      <div className="mt-5 grid gap-5 min-[900px]:grid-cols-[300px_minmax(0,1fr)] min-[900px]:items-start">
        <div className={cn(view !== "patient" && "max-[899px]:hidden")}>
          <ProPhone
            step={step}
            logged={logged}
            onLogMeal={handleLogMeal}
            overrides={overrides}
          />
        </div>
        <div className={cn(view !== "dashboard" && "max-[899px]:hidden")}>
          <ProDashboard step={step} logged={logged} overrides={overrides} />
        </div>
      </div>

      <footer className="mt-8 border-t border-border pt-5">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Blendit Pro è in costruzione. Se ti interessa provarlo con qualche
          paziente, scrivi a{" "}
          <a
            href="mailto:giuseppepirrelli11@gmail.com"
            className="text-primary underline underline-offset-2"
          >
            giuseppepirrelli11@gmail.com
          </a>
          .
        </p>
      </footer>
    </div>
  );
}

function ViewTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex-1 cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-background text-foreground"
          : "text-muted-foreground"
      )}
    >
      {label}
    </button>
  );
}
