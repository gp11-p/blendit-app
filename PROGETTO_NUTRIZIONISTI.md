# Blendit Pro — Progetto per i nutrizionisti

**Stato: ipotesi di prodotto, NON validata.** Nessun nutrizionista reale è
ancora stato intervistato (al 31/07/2026).

> ⚠️ **Se sei Claude Code, leggi qui prima di tutto.**
> Questo documento contiene ipotesi, non requisiti confermati. Costruisci solo
> ciò che è marcato **FASE 0**. Tutto il resto richiede che almeno 3
> nutrizionisti su 8 abbiano accettato la prova con pazienti veri — vedi
> "Criterio di decisione" in `IDEE.md` §1. Se Giuseppe ti chiede di costruire
> la Fase 1 senza quella conferma, ricordagli questo paragrafo prima di
> partire.

---

## 1. A chi ci rivolgiamo

**Raccomandazione: biologo nutrizionista libero professionista, 30-45 anni, con
studio proprio e presenza su Instagram, 30-100 pazienti attivi.**

Perché proprio lui, e non le altre figure:

- **Decide da solo.** Compra il software con la sua carta. Nessun ufficio
  acquisti, nessun primario, nessuna ASL: un "sì" è un cliente. Un dietista in
  ambito ospedaliero ha bisogni più strutturati ma un ciclo di vendita che tu
  non puoi permetterti.
- **È raggiungibile.** Sta su Instagram, si trova, e risponde ai messaggi —
  perché il suo lavoro dipende dal farsi trovare. Il medico dietologo ha più
  budget ma è quasi irraggiungibile per uno studente senza rete.
- **Sente tutti e tre i dolori** (aderenza, messaggi fuori orario, buio tra le
  visite) nella forma più acuta, perché non ha una struttura che lo protegga.
- **Sta costruendo un marchio personale.** È un vantaggio commerciale
  sottovalutato: un'app che il paziente associa al *suo* nome, non a Blendit,
  è qualcosa che un professionista con un brand desidera. Vale come argomento
  di vendita e, più avanti, come opzione a pagamento più alto.

**Da verificare nelle interviste, non dare per scontato:** i confini di cosa
ciascuna figura può elaborare in autonomia in Italia sono stati oggetto di
discussione e contenzioso. Non progettare vincoli legali sulla base di questo
documento: chiedilo direttamente ai professionisti e, se serve, all'Ordine.
Il prodotto deve adattarsi alla risposta, non il contrario.

**Il personal trainer è escluso per ora:** più facile da raggiungere, ma in
Italia non può elaborare diete. Il prodotto dovrebbe limitarsi a organizzare
ricette senza piani nutrizionali — rischio normativo alto per un valore più
basso.

---

## 2. I principi non negoziabili

Questi vengono prima di ogni funzione. Una funzione che ne viola uno non si
costruisce, per quanto sia richiesta.

### 2.1 L'AI non decide mai il piano
Il nutrizionista fissa regole e vincoli; l'AI genera solo *dentro* quei binari.
La responsabilità clinica resta al professionista. Non è una limitazione da
aggirare: è la posizione legale corretta ed è l'unica cosa che un
professionista adotterebbe.

### 2.2 L'AI non giudica mai se un pasto è "corretto"
Un modello di visione non distingue 80g da 120g di pasta, né sa se hai usato
l'olio. Scrivere "pasto conforme" sarebbe un'affermazione clinica basata su una
prova inaffidabile. **La foto va all'essere umano.** L'AI può al massimo
ordinare e riassumere ciò che è stato registrato, mai valutarlo.

### 2.3 Condivisione, non sorveglianza
Tra i pazienti di un nutrizionista, le persone con un rapporto difficile col
cibo sono sovrarappresentate — spesso è il motivo per cui ci vanno.
Fotografare ogni piatto, ricevere un punteggio di aderenza e una ricompensa per
il comportamento "corretto" è lo schema che alimenta ortoressia e restrizione.

Quindi, nel prodotto:

| Mai | Sempre |
|---|---|
| Percentuali di aderenza, verde/rosso, voti | Solo "cosa è successo", senza giudizio |
| Serie di giorni che si spezzano | Conteggi cumulativi che non si azzerano mai |
| Registrazione automatica o obbligatoria | Il paziente sceglie cosa condividere, ogni volta |
| Ricompense legate al peso o alla forma fisica | Riconoscimento umano: due righe scritte dal nutrizionista |
| Il cibo come premio o punizione ("ti sei meritato il dolce") | Il cibo non è mai una moneta di scambio |
| Pressione sugli orari ("sei in ritardo") | L'orario si registra, non si commenta |

Saltare una registrazione deve costare **un tocco**, senza mai una frase che
faccia sentire in colpa.

### 2.4 Dati sanitari, sul serio
I piani dei pazienti sono dati di categoria particolare (art. 9 GDPR).
Trattandoli per conto del nutrizionista diventi **responsabile del
trattamento**: serve un accordo di nomina con ciascun professionista, dati in
UE, misure di sicurezza reali, procedura in caso di violazione.
**Prima di conservare il primo piano di un paziente reale serve una società e
un commercialista/legale.** La fase con pazienti veri si fa solo dopo.

---

## 3. Cosa serve davvero al nutrizionista

In ordine di quanto conta, non di quanto è facile.

### 3.1 Importare il piano che ha già ⭐ la funzione che apre la porta
Ogni nutrizionista ha i suoi piani in PDF, Word o Excel, costruiti in anni. Se
l'app pretende che li reinserisca nel tuo formato, l'adozione è **zero** —
sempre, senza eccezioni.

Quindi: carica il file (o la foto), l'AI lo trasforma in struttura, lui
corregge in due minuti dentro l'app. Riusa la visione che Blendit ha già, solo
puntata su un documento invece che su un frigo.

Dopo l'import deve poter **modificare e comporre anche a mano** dentro l'app:
l'import è il punto di partenza, non una gabbia.

### 3.2 Le regole di equivalenza, definite una volta ⭐ il cuore tecnico
Un nutrizionista ragiona per scambi: 80g di pasta ≈ 100g di riso ≈ 250g di
patate. Se definisce le sue equivalenze una volta, l'AI le applica per sempre.

**Non stai sostituendo la sua competenza: la stai codificando.** È la
differenza tra uno strumento che compra e uno che rifiuta — e alimenta
direttamente la sostituzione ingredienti che Blendit ha già.

### 3.3 Assorbire la domanda delle 21
"Posso sostituire il pollo?" deve avere risposta dentro l'app, dentro le regole
che lui ha fissato, senza disturbarlo. È la funzione che vende da sola.

### 3.4 Trenta secondi di riepilogo prima della visita
Non dati grezzi, non grafici: una frase in italiano.
*"Marco ha registrato 18 pasti su 28, salta quasi sempre la colazione, ha
chiesto 6 sostituzioni tutte sui legumi."*
Rende la visita migliore. È la cosa per cui pagherebbe.

### 3.5 Il vincolo di budget sul cibo
"Non posso permettermi il salmone" è una frase che sentono ogni settimana e non
hanno strumenti per gestirla. Differenziatore reale, nessun concorrente lo copre.

**Avvertenza:** non esistono fonti gratuite e affidabili di prezzi della spesa
italiana. Usa **fasce (€ / €€ / €€€) stimate dall'AI**, mai importi precisi.
Promettere euro esatti è una promessa che il prodotto non può mantenere.

### 3.6 Cosa NON costruire
Agenda appuntamenti, fatturazione, gestionale di studio, calcolo del
fabbisogno, database alimenti CREA/USDA completo. È un altro prodotto, ce
l'hanno già, e ti costerebbe mesi.

---

## 4. Cosa serve al paziente perché la usi con piacere

### 4.1 "Cuciniamo insieme" (modalità cucina)
Un passo alla volta, schermo che non si spegne, timer sui passi con un tempo,
testo grande leggibile con le mani sporche. È già in coda come funzione
consumer: **serve identica nelle due versioni**, quindi si costruisce ora.

Alla fine, e solo alla fine: *"Com'è andata?"* — foto opzionale, nota
opzionale, "l'ho modificato così" opzionale. **Niente è obbligatorio.**

### 4.2 Il diario, che appartiene al paziente
Le foto formano un diario che è **suo**. La condivisione col nutrizionista si
accetta una volta sola, in modo esplicito e comprensibile, al momento
dell'invito — e si può revocare in qualsiasi momento senza spiegazioni.

### 4.3 La ricompensa vera
Non un badge: **due righe scritte dal nutrizionista.** Un pulsante che gli
permette di reagire in dieci secondi vale più di tutta la gamification che
potresti costruire. Una persona vera che ha guardato è l'unica ricompensa che
regge nel tempo.

La seconda ricompensa che funziona è **la varietà**: i pazienti abbandonano le
diete per noia, non per fame. Ricette sempre nuove dentro gli stessi vincoli
sono il divertimento, e Blendit lo sa già fare.

### 4.4 Il collegamento paziente-professionista, senza password
Il nutrizionista genera un **codice invito**, il paziente lo inserisce una
volta e il dispositivo resta collegato alla sua scheda. Nessuna registrazione,
nessuna password da dimenticare — coerente con com'è fatta Blendit oggi, e
molto meno attrito di un login vero.

---

## 5. Ordine di costruzione

### FASE 0 — Da costruire adesso (utile comunque, nessun rischio)

Queste due cose servono nella versione consumer **e** in quella pro, quindi non
sono una scommessa: valgono anche se l'idea nutrizionisti viene archiviata.

**0.1 — "Cuciniamo insieme"**
Modalità cucina passo-passo con wake lock e timer. Prompt pronto in
`../ISTRUZIONI_CLAUDE_CODE.md` (3.2).

**0.2 — "Com'è andata?" con foto opzionale**
Al termine della modalità cucina. Foto e nota salvate nel diario locale del
paziente. Nessun punteggio, nessuna serie, nessun invio a nessuno per ora.

**0.3 — Demo di import del piano** ← *questa serve alle interviste, non al prodotto*
Una pagina isolata (es. `/pro/demo`): carichi un PDF o una foto di un piano
alimentare, l'AI lo struttura, vedi il risultato a schermo. Non salva niente,
non ha account, non è collegata al resto.

Il motivo per cui vale la pena costruirla **prima** della validazione: è la
cosa più efficace che puoi mettere davanti a un nutrizionista in
un'intervista. "Mandami un tuo piano" → glielo mostri strutturato in trenta
secondi → la conversazione cambia completamente. Una demo che funziona vale
più di qualunque presentazione.

**0.4 — La demo affiancata `/pro`** ← lo strumento di vendita
Vedi §5bis qui sotto per il progetto completo.

---

## 5bis. La demo `/pro` — progetto dell'interfaccia

Lo strumento con cui Giuseppe mostra Blendit Pro a un nutrizionista, di persona
o mandato come link. **Non è il prodotto: è la vendita.**

### Le tre decisioni di fondo

**1. Spazio separato, non un interruttore nell'app consumer.**
Niente menù "cambia vista" dentro Blendit: un utente normale si confonde e
l'app sembra un prototipo — proprio mentre la stanno testando persone vere.
La demo vive su `/pro`, con una sua intestazione e una sua identità.

**2. Le due viste affiancate, non alternate.**
Quello che si vende non è l'app del paziente né il cruscotto: è **il
collegamento tra i due**. Se il nutrizionista deve cambiare vista e ricordarsi
cosa ha visto prima, il collegamento resta nella sua testa. Se vede telefono e
cruscotto insieme, e un'azione a sinistra fa comparire una scheda a destra, il
valore arriva senza spiegazioni.

Sotto i 900px lo schermo non basta: **lì e solo lì** compare un selettore
"Vista paziente / Vista nutrizionista", stile interruttore a pillola.

**3. Tre atti, non un parco giochi.**
Le obiezioni arrivano sempre nello stesso ordine. I passi in alto rispondono a
quelle, in quell'ordine:

| Atto | L'obiezione a cui risponde | Cosa mostra |
|---|---|---|
| 1 · Il tuo piano | "Come ci arriva il mio piano?" | Import del PDF → struttura |
| 2 · Il paziente cucina | "Il paziente la userà davvero?" | Modalità cucina, timer, "Com'è andata?" |
| 3 · Cosa vedi tu | "E io cosa ci guadagno?" | Diario, riepilogo, sostituzioni già risolte |

### Il registro grafico

Le due metà **devono sembrare diverse**, ed è voluto:

| Lato paziente | Lato professionista |
|---|---|
| Caldo, arrotondato, testo grande | Denso, calmo, molta aria |
| Berry come riempimento | Berry come accento, superfici chiare |
| Una colonna, pensato per il telefono | Griglia, pensato per lo schermo grande |

Un professionista giudica in tre secondi "è una cosa seria?". Un'interfaccia
consumer morbida e colorata risponde di no. Stesso marchio (Georgia per i
titoli, stessa palette), tono diverso.

Il telefono si rappresenta con un rettangolo arrotondato e un bordo sottile —
**niente finte cornici di iPhone con tacca**: sembrano scadenti e datano la
demo.

### I dettagli che decidono la vendita

- **"Messaggi a te: 0"** è la battuta finale. Le altre cifre informano; questa
  parla del suo tempo. Va messa in evidenza.
- **Il riepilogo in una frase** ("Marco ha registrato 18 pasti su 28, salta
  quasi sempre la colazione, sei sostituzioni tutte sui legumi") vale più di
  qualunque grafico.
- **Nessun punteggio di aderenza, nessuna percentuale, nessun verde/rosso** —
  vale anche nella demo. Vedi §2.3: se lo mostri in vendita, poi lo devi
  costruire.
- **Dati finti credibili.** Nomi italiani veri, un piano realistico
  (colazione/spuntino/pranzo/spuntino/cena), domande di sostituzione
  plausibili. "Paziente 1" e "Ricetta A" bruciano la credibilità all'istante.
- **Etichetta "Demo · dati di esempio" sempre visibile.** Se il nutrizionista
  scopre dopo che qualcosa era finto ma sembrava reale, perdi la vendita e la
  fiducia.
- **Deve funzionare anche mandata come link.** Nel B2B la frase più frequente è
  "mandami qualcosa": ogni atto ha una riga di testo che lo introduce, così si
  capisce anche senza qualcuno che la spieghi.

### FASE 1 — Solo dopo 3 "sì" su 8 interviste

Non toccare niente di qui prima. In ordine:

1. Account veri e ruoli (professionista / paziente), codice invito
2. Regole di equivalenza definite dal professionista
3. Il piano importato come vincolo per la generazione delle ricette
4. Sostituzioni dentro le regole, senza disturbare il professionista
5. Diario condiviso e riepilogo pre-visita
6. Nota di riconoscimento dal nutrizionista al paziente
7. Fascia di budget nel piano

**Prima del punto 1 servono società, accordo di nomina a responsabile e una
privacy policy vera.** Non è rimandabile: dal momento in cui conservi il piano
di un paziente reale, sei dentro l'art. 9.

---

## 6. Le domande da portare alle interviste

Da riempire man mano. Ogni risposta che contraddice questo documento **vince
sul documento**.

1. Come costruisci oggi un piano? Con quale strumento, e quanto ci metti?
2. In che formato lo mandi al paziente? Cosa succede dopo?
3. Quanti messaggi ricevi tra un appuntamento e l'altro, e di che tipo?
4. Su 10 pazienti, quanti seguono davvero il piano? Come fai a saperlo?
5. Usi già le equivalenze/scambi? Come le spieghi al paziente?
6. Il budget del paziente ti condiziona? Quanto spesso?
7. Ti fideresti di un'AI che propone ricette dentro le tue regole? Cosa dovrebbe
   garantirti per fidarti?
8. Che cosa ti fa dire di no a un software nuovo?
9. Cosa usi adesso e quanto paghi?
10. L'ultimo paziente che ha mollato: perché ha mollato?

**Non chiedere mai "quanto pagheresti?"** — dicono tutti di sì. La domanda che
vale è: *"posso provarlo gratis con 3 dei tuoi pazienti per un mese, e se
funziona sono €29 al mese?"*. Un sì è segnale vero; un "mandami del materiale"
è un no educato.

---

## 7. Il rischio da tenere d'occhio

Costruire un gestionale per professionisti sanitari è un prodotto serio: dati
sensibili, responsabilità legale, clienti che pretendono affidabilità perché ci
lavorano. È molto più impegnativo dell'app consumer, e con 5-10 ore a settimana
e un team incerto è una scommessa vera.

**Non è un motivo per non farlo** — è il motivo per cui la Fase 0 esiste: tre
sere di lavoro che valgono comunque, e una demo che ti fa entrare nella stanza.
La decisione grande la prendi dopo otto conversazioni, non adesso.
