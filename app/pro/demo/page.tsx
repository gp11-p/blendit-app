import type { Metadata } from "next";
import { ProImportDemo } from "@/components/pro/ProImportDemo";

// Pagina /pro/demo — Fase 0.3 di PROGETTO_NUTRIZIONISTI.md.
//
// Diversa da /pro: quella è la vendita completa con dati finti, questa è lo
// strumento da usare DURANTE un'intervista con un file vero del nutrizionista
// che hai davanti. "Mandami un tuo piano" → glielo mostri strutturato in
// trenta secondi → la conversazione cambia.
//
// Isolata davvero: nessun account, nessun salvataggio, nessun collegamento
// dal resto dell'app o da /pro. Non indicizzata.

export const metadata: Metadata = {
  title: "Blendit Pro — Demo import piano",
  description:
    "Carica un piano alimentare e guarda come Blendit lo struttura in automatico.",
  robots: { index: false, follow: false },
};

export default function ProDemoImportPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <header>
        <p className="font-heading text-2xl font-bold text-foreground">
          Blendit <span className="text-primary">Pro</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Carica un piano alimentare (PDF o foto): l&apos;AI lo trasforma in
          giorni, pasti e alimenti, così com&apos;è scritto.
        </p>
      </header>

      <div className="mt-6">
        <ProImportDemo />
      </div>
    </main>
  );
}
