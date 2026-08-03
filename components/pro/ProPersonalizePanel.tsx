"use client";

import { useState } from "react";
import { Check, ChevronDown, Copy, RotateCcw } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DemoOverrides } from "@/lib/proDemoData";

interface ProPersonalizePanelProps {
  overrides: DemoOverrides;
  isCustomized: boolean;
  onChange: (overrides: DemoOverrides) => void;
  onReset: () => void;
}

/**
 * Pannello per personalizzare la demo /pro prima di mostrarla a un
 * nutrizionista specifico. Tutto resta finto — cambiano solo i nomi e i
 * numeri, mai la struttura — e i valori vivono nell'URL (vedi ProDemo.tsx),
 * non su un database: copiare il link basta a "salvare" la personalizzazione.
 */
export function ProPersonalizePanel({
  overrides,
  isCustomized,
  onChange,
  onReset,
}: ProPersonalizePanelProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function update<K extends keyof DemoOverrides>(key: K, value: DemoOverrides[K]) {
    onChange({ ...overrides, [key]: value });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Niente clipboard disponibile (es. contesto non sicuro): non è
      // grave, il link è comunque nella barra degli indirizzi.
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-full bg-muted px-3.5 py-1.5 text-sm text-muted-foreground">
        Personalizza per questo cliente
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome nutrizionista">
            <Input
              value={overrides.nutritionistName}
              onChange={(e) => update("nutritionistName", e.target.value)}
            />
          </Field>
          <Field label="Nome paziente">
            <Input
              value={overrides.patientName}
              onChange={(e) => update("patientName", e.target.value)}
            />
          </Field>
          <Field label="Pasti registrati">
            <Input
              type="number"
              min={0}
              value={overrides.mealsLogged}
              onChange={(e) => update("mealsLogged", numberOrZero(e.target.value))}
            />
          </Field>
          <Field label="Pasti totali nel periodo">
            <Input
              type="number"
              min={0}
              value={overrides.mealsTotal}
              onChange={(e) => update("mealsTotal", numberOrZero(e.target.value))}
            />
          </Field>
          <Field label="Sostituzioni chieste">
            <Input
              type="number"
              min={0}
              value={overrides.substitutions}
              onChange={(e) => update("substitutions", numberOrZero(e.target.value))}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button type="button" size="sm" onClick={copyLink}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copiato" : "Copia link personalizzato"}
          </Button>
          {isCustomized && (
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="size-3.5" />
              Ripristina dati di esempio
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function numberOrZero(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
