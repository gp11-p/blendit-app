import type { Metadata } from "next";
import { Suspense } from "react";
import { ProDemo } from "@/components/pro/ProDemo";
import { ProDemoTracker } from "@/components/pro/ProDemoTracker";

// Pagina /pro — la demo di Blendit Pro per i nutrizionisti.
//
// Volutamente NON collegata dall'app consumer: un utente normale che ci
// finisse dentro si confonderebbe, e l'app sembrerebbe un prototipo proprio
// mentre la stanno provando persone vere. Ci si arriva solo con il link
// diretto, che è il modo in cui viene usata (in riunione o mandata via
// messaggio).
//
// Tutto il contenuto è statico: nessun account, nessun salvataggio, nessuna
// chiamata all'AI. I dati di esempio stanno in lib/proDemoData.ts.
// Progetto e motivazioni: PROGETTO_NUTRIZIONISTI.md §5bis.

export const metadata: Metadata = {
  title: "Blendit Pro — per nutrizionisti",
  description:
    "Il piano che hai scritto, seguito davvero. E le domande dei pazienti a cui non devi più rispondere la sera.",
  // Non deve finire nei motori di ricerca: è materiale commerciale in prova,
  // non una pagina pubblica del prodotto.
  robots: { index: false, follow: false },
  openGraph: {
    title: "Blendit Pro — per nutrizionisti",
    description:
      "Il piano che hai scritto, seguito davvero. E le domande dei pazienti a cui non devi più rispondere la sera.",
    locale: "it_IT",
    type: "website",
  },
};

export default function ProPage() {
  return (
    <main className="flex-1">
      <ProDemoTracker />
      <Suspense fallback={null}>
        <ProDemo />
      </Suspense>
    </main>
  );
}
