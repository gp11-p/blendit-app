import Link from "next/link";
import type { Metadata } from "next";

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
// domani aggiungi account, sincronizzazione su server, pubblicità o
// profilazione, questa pagina non basta più e serve una vera informativa
// (e un titolare del trattamento identificabile).
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
            La tua dispensa resta sul tuo dispositivo
          </h2>
          <p className="mt-1 text-muted-foreground">
            Dispensa, piano settimanale e lista della spesa sono salvati nella
            memoria del tuo browser, non su un nostro server. Non li vediamo e
            non possiamo recuperarli. Se cancelli i dati del browser,
            spariscono.
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
            Cancella i dati del sito dalle impostazioni del browser: a quel
            punto non resta nulla che ti riguardi, perché non c&apos;è nessun
            account da eliminare.
          </p>
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
