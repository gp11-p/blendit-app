# Blendit — Quaderno delle idee

Raccolta di tutte le idee di sviluppo, crescita e modello di business.
Serve a **non perdere le idee buone** e, altrettanto importante, a **non
rimettere in discussione ogni mese quelle già scartate**.

> Leggilo insieme a `STATO_PROGETTO.md` (cosa esiste già) e a
> `../ISTRUZIONI_CLAUDE_CODE.md` (i prompt pronti, in ordine).

---

## Come si usa

**Se sei Giuseppe:** quando ti viene un'idea, scrivila qui subito, anche mezza
formata. Non implementarla lo stesso giorno — le idee migliori sopravvivono a
una settimana di attesa, le peggiori no.

**Se sei Claude Code:** questo file è un *magazzino*, non una lista di cose da
fare. Non implementare niente da qui se Giuseppe non te lo chiede
esplicitamente. Se ti sembra che un'idea qui dentro sia rilevante per il lavoro
in corso, dillo — non partire.

### La regola di triage

Prima di promuovere un'idea da "parcheggiata" a "prossima", deve rispondere
sì a una di queste due domande:

1. **Serve a far tornare qualcuno una seconda volta?**
2. **Serve a capire perché non tornano?**

Tutto il resto aspetta, per quanto sia divertente da programmare.

### Legenda stato

| Stato | Significato |
|---|---|
| 🟢 **Prossima** | Decisa. Va nella coda di `ISTRUZIONI_CLAUDE_CODE.md`. |
| 🟡 **Da validare** | Buona idea, ma prima serve una prova che non richiede codice. |
| ⚪ **Parcheggiata** | Sensata, momento sbagliato. Con scritto cosa deve succedere per riprenderla. |
| 🔴 **Scartata** | Con il motivo. Non riaprirla senza un fatto nuovo. |

---

## 1. L'idea grande: Blendit per nutrizionisti

**Stato: 🟡 Da validare — aggiunta il 31/07/2026**

### Cosa

Un pannello per il nutrizionista dove imposta il piano alimentare del paziente
(regole, vincoli, obiettivi). Il paziente usa Blendit come lo usa oggi, ma
dentro i binari fissati dal professionista: le ricette rispettano il piano, le
sostituzioni restano equivalenti, la lista della spesa nasce dal piano più la
dispensa.

### Perché è più forte del consumer

- **Qualcuno paga.** Un professionista spende 25-40 €/mese per uno strumento che
  gli fa risparmiare tempo. Un utente consumer paga zero, per sempre.
- **La ritenzione si capovolge.** Il nutrizionista apre il software perché è il
  suo lavoro, non perché ne ha voglia. È la differenza strutturale tra strumento
  professionale e app lifestyle — il muro contro cui sbatte oggi Blendit.
- **La distribuzione si risolve.** Un nutrizionista porta 30-100 pazienti. Dieci
  professionisti = 500 utenti veri. Con 5-10 ore a settimana è l'unica strada
  realistica a numeri reali.
- **I pezzi ci sono già:** dispensa, preferenze dietetiche, piano settimanale,
  lista della spesa, sostituzione ingredienti.

### Il posizionamento giusto (non è ovvio)

Il dolore del nutrizionista **non è creare il piano** — quella è la sua
competenza, e ha già software che lo fanno (Dietosystem, MètaDieta, o Word).

I suoi dolori veri sono tre:

1. il paziente non segue il piano;
2. i messaggi fuori orario ("posso sostituire il pollo?") — tempo non pagato;
3. il buio totale tra un appuntamento e l'altro.

Quindi la frase da vendere non è "software per piani alimentari" ma:
**"l'app che fa seguire davvero il piano che hai scritto, e che smette di farti
rispondere su WhatsApp alle 21"**.

### Il vincolo non negoziabile

**L'AI non decide il piano. Mai.** Il nutrizionista fissa le regole, l'AI esegue
solo dentro quei binari. Non è una limitazione da aggirare: è la posizione
legale corretta (la responsabilità clinica resta al professionista) ed è
l'unica cosa che i nutrizionisti adotterebbero — uno strumento che sembra
sostituire il loro giudizio non lo compra nessuno.

### I costi reali

- **Dati sanitari.** Conservando i piani dei pazienti diventi responsabile del
  trattamento di dati art. 9 GDPR per conto del professionista: accordo di
  nomina con ciascuno, misure di sicurezza serie, dati in UE, procedura in caso
  di violazione. Da qui in poi serve una società, non un progetto studentesco.
- **Ambiti professionali.** Tra biologo nutrizionista, dietista e medico
  cambiano i confini di cosa si può prescrivere: va verificato, cambia cosa il
  software può fare.
- **Account veri.** Oggi c'è Supabase con un identificativo di dispositivo, non
  utenti reali. Servono autenticazione, ruoli professionista/paziente e
  permessi. Meno lontano di un mese fa, ma non gratis.

### Come validarla senza scrivere una riga

Nella settimana "senza codice", parla con **8 nutrizionisti** invece che con 30
consumatori. Stesso tempo, informazione molto più utile.

Domande che fanno emergere la verità:

- Quanti messaggi ricevi dai pazienti tra un appuntamento e l'altro, e di che tipo?
- Su 10 pazienti, quanti seguono davvero il piano?
- Cosa usi adesso e quanto paghi?
- L'ultimo paziente che ha mollato: perché ha mollato?

**Non chiedere mai "quanto pagheresti?"** — dicono tutti di sì e non significa
niente. La domanda che vale è: *"posso provarlo gratis con 3 dei tuoi pazienti
per un mese?"*. Un sì è segnale vero; un "mandami del materiale" è un no educato.

**Prima versione a mano:** il nutrizionista ti manda il piano, tu configuri i 3
pazienti nell'app che già esiste. Zero codice, e in tre settimane sai se il
valore c'è.

### Criterio di decisione

Se **3 o più nutrizionisti su 8** accettano la prova gratuita con pazienti veri
→ si passa a costruirlo, e diventa la direzione principale del progetto.
Sotto i 3 → si resta sul consumer e si riparcheggia qui.

### Nota sui finanziamenti

Questo cambia anche il discorso bandi. Un gestionale B2B per professionisti
sanitari con clienti paganti è finanziabile; un'app di ricette no. E rende
credibile il numero del pitch: un nutrizionista a 30 €/mese vale 360 € l'anno,
un utente consumer vale zero.

---

## 2. Funzionalità del prodotto (lato food)

### 🟢 Modalità cucina
**Cosa:** schermata a tutto schermo, un passo alla volta, schermo che non si
spegne (Screen Wake Lock API), timer sui passi che contengono un tempo.
**Perché:** ti mette nelle mani della persona *mentre* cucina — è lì che nasce
l'abitudine. È anche il differenziatore più difendibile: sposta Blendit da
"generatore di ricette" (commodity, lo fa ChatGPT) a "compagno mentre cucini".
**Costo:** 1-2 sere. **Prompt già pronto** in `../ISTRUZIONI_CLAUDE_CODE.md` (3.2).

### 🟢 Sostituzione ingrediente mancante
**Cosa:** "non hai la mozzarella? prova con..." con rigenerazione dei passi
interessati.
**Perché:** riduce l'abbandono a metà ricetta, ed è esattamente il punto in cui
un domani vive la commissione B2B. È anche un mattone della versione
nutrizionisti (sostituzioni dentro i vincoli del piano).
**Costo:** 1-2 sere. **Prompt pronto** in `../ISTRUZIONI_CLAUDE_CODE.md` (3.3).

### ⚪ Notifiche push settimanali
**Cosa:** "domenica alle 18, pianifichiamo la settimana?".
**Perché:** senza account non esiste nessun modo di richiamare un utente.
È il singolo lever di ritenzione più forte disponibile.
**Sbloccata da:** la PWA installabile c'è già, e ora c'è anche Supabase per
conservare le sottoscrizioni — mancano solo le chiavi VAPID e la logica di
invio. Molto meno lavoro di un mese fa.
**Quando riprenderla:** solo **dopo** aver visto dai numeri che una parte di
utenti riapre l'app da sola. Notificare chi non tornerebbe comunque non lo fa
tornare: lo fa disinstallare.

### ⚪ Cosa scade prima / anti-spreco
**Cosa:** data di aggiunta o scadenza sugli articoli in dispensa, e ricette che
danno priorità a ciò che sta per andare a male. Più un contatore "cibo salvato
questo mese".
**Perché:** non è solo una funzione, è una **cornice**. "Anti-spreco" apre porte
che "generatore di ricette AI" non apre: bandi EU, stampa locale, associazioni.
**Rischio:** aggiungere una data per ogni articolo alza l'attrito di
inserimento, che è il difetto che uccide tutte le app di dispensa. Da
progettare con cura (default intelligenti, mai un campo obbligatorio).
**Quando:** dopo che la dispensa dimostra di essere usata davvero.

### ⚪ Immagine di anteprima per la condivisione
**Cosa:** immagine Open Graph generata al volo con il titolo della ricetta.
**Perché:** la condivisione su WhatsApp esiste già; oggi il link appare spoglio.
Un'anteprima curata alza i click di chi riceve il link.
**Costo:** mezza sera con l'API `ImageResponse` di Next.

### ⚪ Sincronizzazione tra dispositivi
**Cosa:** ritrovare la propria dispensa su telefono e computer.
**Perché:** oggi l'identificativo è per dispositivo, quindi telefono e PC vedono
dispense diverse.
**Prerequisito:** account veri. Da fare solo se le persone lo chiedono — è
un'ottima domanda da porre nelle interviste, non da indovinare.

### 🔴 Valutazione ricetta con commento libero
**Motivo dello scarto:** il pollice su/giù c'è già; aggiungere un campo di testo
alza l'attrito e lo compila quasi nessuno. Il "perché" si scopre parlando con le
persone, non con un form.

---

## 3. Crescita e distribuzione (budget €0)

### 🟢 I primi 30 utenti dal network diretto
Non è imbarazzante, è l'unico canale che funziona con certezza. E 5 sessioni in
cui *guardi* qualcuno usare l'app valgono più di 500 visite anonime.

### 🟢 Moltiplicatori
Micro-creator food italiani (10-50k follower: rispondono, i grandi no),
dietisti e nutrizionisti, associazioni studentesche (ESN Lleida, residenze),
gruppi Facebook "svuota frigo", realtà anti-spreco.
**Il messaggio giusto** non è "prova la mia app" ma *"ho costruito uno strumento
gratuito per la tua community, senza pubblicità e senza registrazione. Se ti è
utile usalo; se no, dimmi perché non funziona."*

### ⚪ Contenuti TikTok / Reels
Formato "ho questi 4 ingredienti, cosa cucino". Funziona, ma richiede
costanza per mesi e con 5-10 ore a settimana si mangia tutto il tempo di
sviluppo. Da fare solo se i moltiplicatori non danno risultato.

### 🟢 Geografia: parti da Monopoli, punta a Milano
Milano ha il cliente ideale ma lì sei invisibile senza budget. A Monopoli il
passaparola funziona e puoi guardare le persone usare l'app di persona. Milano
è la fase due, quando sai già che il prodotto tiene.

---

## 4. Modello di business

### 🟢 Segnale commissioni (già attivo)
L'evento `missing_ingredient` registra in forma anonima e aggregata quali
ingredienti mancano più spesso. È il dato che rende concreta una trattativa con
un supermercato. Nessun profilo per persona.

### ⚪ Abbonamento B2C
Da valutare solo se il ritorno a 7 giorni supera stabilmente il 20%. Prima di
allora non c'è niente per cui valga la pena pagare.

### 🔴 Pubblicità profilata sui consumi
**Motivo dello scarto (31/07/2026):** le preferenze alimentari possono rivelare
salute (celiachia) e religione (halal/kasher) — dati di categoria particolare
art. 9 GDPR. Servirebbero società costituita, consenso esplicito granulare e
informativa redatta da un legale. E paga pochissimo: con 5.000 utenti fai
qualche decina di euro l'anno, mentre il modello a commissioni vale 50-100
volte di più **sugli stessi dati e senza profilazione**. In più butteresti via
"i tuoi dati restano sul tuo dispositivo", una posizione che Samsung e Google
non possono occupare. Vedi le regole in `CLAUDE.md`.

---

## 5. Altri verticali (fuori dal food)

### ⚪ Wardrobe / outfit dal guardaroba
**Perché non ora:** non è simmetrico al food, è più difficile. Il costo di
inserimento è 10 volte più alto (30-60 foto una per capo, contro una foto sola
del frigo); gli attributi che contano — vestibilità, taglio, tessuto, colore
fedele — si estraggono molto peggio di "pomodori"; un outfit sbagliato brucia
la fiducia molto più di una ricetta mediocre; e la frequenza è più bassa. Le
app di guardaroba esistono da anni (Whering, Acloset, Stylebook) e hanno tutte
ritenzione pessima per questo motivo.
**A favore:** le commissioni sull'abbigliamento sono 5-15% contro l'1-3% della
spesa alimentare. **Il food ha il loop migliore, il fashion l'economia migliore.**
**Come testarlo a costo zero:** il "test del concierge" — per una settimana 10
persone ti mandano foto su WhatsApp e rispondi tu a mano. Se non ti mandano le
foto nemmeno con una persona vera dall'altra parte, non le manderanno mai a
un'app. Idea archiviata, tre mesi risparmiati.

### 🟡 Cibo con vincoli medici o sportivi
Celiachia, diabete, ipertensione, atleti. Stesso motore, dolore molto più alto,
e queste persone pagano. Confluisce naturalmente nell'idea nutrizionisti (§1),
che è la stessa cosa vista dal lato di chi ha la competenza clinica.

### ⚪ Cosmetici / skincare
Inventario di cosa possiedi, routine e incompatibilità tra ingredienti.
Frequenza quotidiana, le etichette si leggono benissimo in foto, commissioni
ottime. Il vicino più interessante dopo il food.

### 🔴 Idee regalo
La decision fatigue c'è, ma si decide 3 volte l'anno: ritenzione impossibile
per costruzione.

### 🔴 Valigia / packing
Bel ponte tra food e wardrobe, ma da solo non è un business: ci si va due volte
l'anno. Semmai una funzione della versione wardrobe, mai un prodotto.

---

## 6. La regola che vale più di tutte

**Non aprire un secondo verticale finché il primo non trattiene.** Due mezzi
prodotti è il modo più comune in cui muoiono i progetti universitari. La
larghezza che rende bello il pitch in 5 minuti è esattamente ciò che lo rende
impossibile da eseguire in 5-10 ore a settimana.

---

## Come aggiungere un'idea qui

Copia questo schema. Se non riesci a riempire "Perché" e "Come si valida",
probabilmente non è ancora un'idea.

```markdown
### [stato] Nome dell'idea
**Cosa:** una frase.
**Perché:** a quale delle due domande di triage risponde.
**Costo:** sere di lavoro, e cosa serve prima.
**Come si valida:** la prova più economica possibile, meglio se senza codice.
**Data:** quando l'hai avuta.
```
