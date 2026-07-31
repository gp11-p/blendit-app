import Link from "next/link";
import type { Metadata } from "next";
import { DeleteAllDataButton } from "@/components/DeleteAllDataButton";

export const metadata: Metadata = {
  title: "Privacy — Blendit",
  description: "Come Blendit tratta i tuoi dati: in breve, quasi non li tratta.",
};

// Pagina privacy.
//
// Serve prima di far provare l'app a persone reali in Europa: anche senza
// account, l'app registra eventi anonimi e va detto. È scritta in linguaggio
// normale di proposito — un testo legale copiato da un generatore non lo
// legge nessuno e non aumenta la fiducia.
//
// ATTENZIONE: questo testo descrive fedelmente cosa fa l'app OGGI. Se un
// domani aggiungi account veri, pubblicità o profilazione, questa pagina non
// basta più e serve una vera informativa (e un titolare del trattamento
// identificabile).
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Torna a Blendit
      </Link>

      <h1 className="mt-6 font-heading text-3xl font-bold text-foreground">
        Privacy
      </h1>

      <p className="mt-4 text-muted-foreground">
        In breve: Blendit non ti chiede chi sei e non ha modo di saperlo.
      </p>

      <section className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-foreground">
        <div>
          <h2 className="font-heading text-lg font-semibold">
            Nessun account, nessun cookie
          </h2>
          <p className="mt-1 text-muted-foreground">
            Non ti registri, non lasci un&apos;email, non usiamo cookie di
            profilazione. Per questo non vedi nessun banner sui cookie: non
            c&apos;è niente da accettare.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold">
            Dispensa, piano e lista della spesa: dove vivono
          </h2>
          <p className="mt-1 text-muted-foreground">
            Sono salvati su un nostro server (Supabase), non solo nella
            memoria del browser: è per questo che sopravvivono anche se
            cancelli i dati del sito. Non sono però collegati a un account:
            il tuo browser genera un identificativo casuale e usa quello per
            ritrovare i tuoi dati, esattamente come per la misurazione
            anonima qui sotto. Senza un vero account, questi dati non si
            sincronizzano tra un dispositivo e l&apos;altro: il telefono e il
            computer vedono dispense diverse. Per alcuni ingredienti
            numerabili (es. uova, zucchine) la dispensa può anche ricordare
            una quantità approssimativa, che puoi correggere tu in qualsiasi
            momento.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold">
            Le foto non vengono conservate
          </h2>
          <p className="mt-1 text-muted-foreground">
            Se usi la fotocamera, l&apos;immagine viene inviata al modello di
            intelligenza artificiale di Anthropic solo per riconoscere gli
            ingredienti, e poi scartata. Non la salviamo da nessuna parte.
            Per gli ingredienti che si contano a pezzi, il modello prova
            anche a stimare quante unità vedi nella foto: è la stessa
            analisi, non un invio aggiuntivo della foto.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold">
            Cosa misuriamo (e cosa no)
          </h2>
          <p className="mt-1 text-muted-foreground">
            Registriamo eventi anonimi — ad esempio &quot;è stata generata una
            ricetta&quot; — associati a un identificatore casuale generato dal
            tuo browser. Serve solo a capire se l&apos;app è utile e se le
            persone tornano. Quell&apos;identificatore non è collegato a nessun
            dato personale, e non usiamo queste informazioni per pubblicità
            profilata.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold">
            Come cancellare tutto
          </h2>
          <p className="mt-1 text-muted-foreground">
            Da quando i dati vivono anche sul server, cancellare la memoria
            del browser da solo non basta più: le righe resterebbero salvate,
            semplicemente irraggiungibili. Usa il pulsante qui sotto per
            cancellare entrambe le cose in un colpo solo.
          </p>
          <div className="mt-3">
            <DeleteAllDataButton />
          </div>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold">Contatti</h2>
          <p className="mt-1 text-muted-foreground">
            Blendit è un progetto in fase di test costruito da un team di
            studenti. Per qualsiasi domanda, scrivi a{" "}
            <a
              href="mailto:giuseppepirrelli11@gmail.com"
              className="text-primary underline underline-offset-2"
            >
              giuseppepirrelli11@gmail.com
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
