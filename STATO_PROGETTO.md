# Blendit App — Stato del progetto

Questo file esiste per far ripartire velocemente una **nuova sessione di
Claude Code** (nuova finestra di contesto) su questo progetto, senza dover
rileggere tutto da zero. Aggiornalo quando il progetto cambia in modo
sostanziale — altrimenti diventa fuorviante invece che utile.

Per il contesto di stile/regole che Claude Code legge automaticamente,
vedi `CLAUDE.md` in questa stessa cartella. Per la roadmap originale a
8 fasi, vedi `GUIDA_SVILUPPO_APP.md` nella cartella superiore (`BLENDIT/`).

---

## Nota sul server di sviluppo locale

Quello "storico" (acceso da giorni, ereditato da sessioni precedenti) è
stato fermato perché era diventato instabile (si ricaricava da solo,
perdendo aggiornamenti in corso). Se Claude Code lo riavvia tramite lo
strumento di anteprima browser, usa `.claude/launch.json` nella cartella
`BLENDIT/` (non `blendit-app/`) — vedi la nota sul PATH di Node in
"Decisioni architetturali" più sotto, già risolta lì dentro.

---

## Cos'è Blendit (lato food, quello costruito qui)

L'utente inserisce cosa ha in frigo (testo o foto), l'AI genera una
ricetta personalizzata. Nessun account, nessun login, nessuna
onboarding: si apre il sito e si usa subito.

## Stack tecnico

- **Next.js 16** (App Router), TypeScript. Attenzione: Next 16 ha
  breaking changes rispetto alle versioni precedenti — se scrivi codice
  che usa API di Next di cui non sei sicuro, controlla prima
  `node_modules/next/dist/docs/` (vedi anche `AGENTS.md`, incluso in
  `CLAUDE.md` con `@AGENTS.md`).
- **Tailwind CSS v4** (config CSS-first in `app/globals.css`, niente
  `tailwind.config.js`) + **shadcn/ui** (preset "base-nova", componenti
  in `components/ui/`, basati su `@base-ui/react`, non Radix).
- **Anthropic SDK** (`@anthropic-ai/sdk`) — modello `claude-sonnet-5`
  per testo e visione. Output strutturato via **Zod + `zodOutputFormat`
  + `client.messages.parse()`** (non JSON "sperato" nel prompt) — vedi
  `app/api/recipe/route.ts` per il pattern di riferimento, riusato
  identico in `app/api/vision/route.ts`.
- **Vercel** per il deploy (auto-deploy ad ogni push su `main`).
- **Supabase** per la persistenza (dispensa, piano pasti, lista della
  spesa), usato in modo anonimo — niente autenticazione utente (vedi
  sezione "Cosa NON c'è").

## Come avviare in locale

```powershell
cd blendit-app
npm run dev
```

Apri `http://localhost:3000`. Serve un file `.env.local` (gitignored,
non su GitHub) con `ANTHROPIC_API_KEY=sk-ant-...`.

Verifica rapida prima di ogni commit: `npx tsc --noEmit` e `npm run lint`
devono essere puliti — è la prassi seguita in tutto il progetto finora.

## Struttura del progetto

```
app/
  page.tsx              — home page: <Header /> + <RecipeFinder />
  layout.tsx             — font (Inter via next/font, Georgia per i titoli)
  globals.css            — palette brand (CSS variables), keyframe shimmer
  api/recipe/route.ts     — genera la ricetta (testo + preferenze)
  api/vision/route.ts     — riconosce ingredienti da una foto
  api/nutrition-plan/route.ts — importa/salva/cancella il piano nutrizionale
  api/plan-recipe/route.ts — genera una ricetta da un pasto del piano + dispensa
  pro/, pro/demo/          — demo di vendita e import piano isolato, vedi punto 26-28

components/
  RecipeFinder.tsx        — componente principale, tiene tutto lo stato
  Header.tsx              — barra in alto (logo + "?")
  IngredientInput.tsx — input manuale ingredienti
  PhotoInput.tsx           — input foto (compressione client-side + vision)
  PreferencesPanel.tsx     — pannello "Personalizza" (tempo/dieta/porzioni/piatto)
  SelectableChip.tsx       — chip riusabile per le selezioni
  RecipeCard.tsx           — mostra la ricetta generata
  RecipeCardSkeleton.tsx   — skeleton animato durante il caricamento
  FridgeEmptyState.tsx     — illustrazione SVG prima di aggiungere ingredienti
  MealPlanPanel.tsx / AddToPlanButton.tsx — piano pasti settimanale
  NutritionPlanPanel.tsx   — piano nutrizionale importato + "genera ricetta" per pasto
  PartnerProductsPreview.tsx — vetrina "presto disponibile" (NON funzionale)
  ui/                      — primitive shadcn (button, card, input, skeleton, collapsible)
  pro/                     — demo di vendita Blendit Pro, vedi punto 26-28

lib/
  types.ts                — Recipe, Preferences e tipi correlati
  preferences.ts           — opzioni (TIME/DIET/DISH_TYPE/SERVINGS/CALORIE) + default
  usePantry.ts              — hook dispensa (Supabase, vedi sotto)
  useMealPlan.ts            — hook piano pasti (Supabase; MEAL_TYPES pranzo/cena)
  useShoppingList.ts        — hook lista della spesa (Supabase)
  useNutritionPlan.ts       — hook piano nutrizionale importato (Supabase)
  planImport.ts             — schema Zod + prompt condivisi tra /pro/demo e /api/nutrition-plan
  supabaseServer.ts / ownerId.ts / deviceId.ts — persistenza anonima, vedi sotto
  utils.ts                  — cn() (da shadcn)
```

## Funzionalità implementate (tutte testate con chiamate AI reali, non mock)

1. **Input ingredienti**: manuale (chip rimovibili) o foto (visione AI,
   compressione lato client se >2MB via Canvas API nativa).
2. **Generazione ricetta**: titolo, tempo, difficoltà, calorie per
   porzione, numero di porzioni (con quantità negli step scalate di
   conseguenza), ingredienti mancanti, passi.
3. **Preferenze** (pannello "Personalizza", collassato di default):
   tempo massimo, dieta (multi-select), porzioni, tipo di piatto, calorie
   massime per porzione. Se l'utente non tocca nulla, la richiesta si
   comporta come senza preferenze (nessun vincolo forzato nel prompt).
4. **Rigenera ricetta**: pulsante "prova un'altra ricetta" — tiene
   traccia degli ultimi 5 titoli mostrati in sessione e istruisce l'AI
   a non ripeterli.
5. **Piano pasti settimanale**: si salva una ricetta su un giorno della
   settimana, con etichetta pranzo o cena (`mealType`, opzionale — le
   ricette pianificate prima di questo campo restano senza etichetta,
   senza errori); più ricette sullo stesso giorno sono già supportate.
   Persiste su Supabase (non solo su quel dispositivo/browser — vedi
   sezione persistenza sotto). Pattern SSR-safe: stato iniziale vuoto,
   popolato via `useEffect` dopo il mount per evitare mismatch di
   hydration (vedi commento in `lib/useMealPlan.ts`).
6. **Vetrina prodotti partner**: per ogni ingrediente mancante, una
   card "presto disponibile" — nessun pulsante di acquisto, nessuna
   integrazione B2B reale dietro. Scelta deliberata per non promettere
   a un investitore una partnership che non esiste (vedi CLAUDE.md).
7. **Polish UI**: shimmer/skeleton durante il caricamento (non uno
   spinner generico), fade-in della ricetta, empty state illustrato,
   palette brand, mobile-first (testato sempre a 375px e 1440px).

8. **Dispensa persistente** (`lib/usePantry.ts`): gli ingredienti non sono
   più uno stato temporaneo, persistono su Supabase. I chip "accesi"
   entrano nella ricetta, quelli spenti restano in dispensa ma vengono
   ignorati. Toglie il motivo principale per cui nessuno tornava una
   seconda volta (ridigitare ogni volta le stesse cose). Quando una
   ricetta va nel piano, gli ingredienti usati per generarla si spengono
   da soli (non si cancellano — restano in dispensa, disattivati) così
   non vengono riproposti come disponibili per la ricetta successiva.
9. **Lista della spesa** (`lib/useShoppingList.ts`): unisce le
   `missingIngredients` di tutte le ricette pianificate. Spuntando un
   articolo, questo finisce in dispensa — è così che si chiude il ciclo
   settimanale pianifica → compra → cucina → ripianifica.
10. **Condivisione ricetta**: Web Share API su mobile, copia negli appunti
    su desktop, testo formattato per WhatsApp con link in fondo.
11. **Feedback 👍/👎** sulla ricetta: unico canale qualitativo, non essendoci
    account né email.
12. **PWA installabile**: `app/manifest.ts` + `public/sw.js` (service worker
    di sola passthrough, nessuna cache) + `components/InstallPrompt.tsx`.
    Prerequisito tecnico per le notifiche push, che su iPhone funzionano
    solo se l'app è stata aggiunta alla home.
13. **Rate limiting** (`lib/rateLimit.ts`) su `/api/recipe` (15 ogni 10 min)
    e `/api/vision` (10 ogni 10 min), più un limite di dimensione
    sull'immagine. Protegge la API key personale dagli abusi.
14. **Misurazione anonima** (`lib/analytics.ts` + `app/api/track/route.ts`):
    ID casuale in `localStorage`, nessun cookie, eventi da lista chiusa
    scritti nei log Vercel. Il conteggio delle visite lo fa il client, così
    dai log grezzi si legge subito chi sta tornando.
15. **Pagina privacy** (`app/privacy/page.tsx`): necessaria prima di far
    testare l'app a persone reali in UE.
16. **Persistenza vera su Supabase**: dispensa, piano pasti e lista della
    spesa non vivono più solo in `localStorage` — sopravvivono anche alla
    cancellazione dei dati del browser. Restano anonime (id per
    dispositivo, non un account); migrazione una tantum dai vecchi dati
    locali al primo caricamento dopo l'aggiornamento. Vedi
    `supabase/schema.sql` e i decisioni sopra.
17. **Limite di calorie** (preferenza "Calorie massime" in "Personalizza"):
    stesso pattern di tempo/porzioni, vincolo passato al prompt AI.
18. **Pranzo o cena nel piano**: ogni pasto pianificato porta un'etichetta
    opzionale (`mealType`); si possono già pianificare più pasti sullo
    stesso giorno.
19. **Inventario con quantità** (solo per ingredienti numerabili — uova,
    zucchine, pomodori...): la foto stima quante unità vedi, o le imposti a
    mano toccando il "+"/"−" sul chip in dispensa. Quando una ricetta va nel
    piano, gli ingredienti tracciati che ha usato si decrementano invece di
    spegnersi del tutto (a quota zero restano visibili, disattivati — non si
    cancellano). Ingredienti a peso/volume (farina, olio...) restano come
    prima: presenza/assenza, senza numero.
    - **2 bug trovati testando e corretti** (utili da conoscere se tocchi
      `lib/usePantry.ts:adjustQuantity`): (a) il chip calcolava il nuovo
      valore leggendo una prop che poteva non essersi ancora aggiornata tra
      un click rapido e l'altro — corretto calcolando il valore dentro la
      updater function di `setItems`, mai prima; (b) click ripetuti
      mandavano più chiamate di rete indipendenti che potevano completarsi
      in un ordine diverso da quello di partenza (l'ultima *eseguita* vince,
      non l'ultima *cliccata*) — corretto con un debounce di 400ms per
      ingrediente (un `Map` di timer in un `useRef`, non uno stato) così
      parte una sola richiesta con il valore finale. **Pattern da riusare**:
      qualunque futuro controllo "+/-" cliccabile rapidamente ha bisogno
      dello stesso debounce; i toggle semplici (on/off) no.
    - **Testato con una foto vera di frigo** (2026-07-31): 10 uova stimate
      (fila nel vano portauova, conteggio esatto) e 3 limoni stimati (cassetto
      frutta, conteggio esatto — solo il nome era impreciso, erano lime).
      Pomodori e uva, presenti ma non in unità facilmente contabili
      (cestello/mazzo), correttamente lasciati senza quantità dal modello:
      comportamento voluto, non un bug (vedi regola "se non sei ragionevolmente
      sicuro, ometti" nel prompt di `app/api/vision/route.ts`).
20. **Modalità cucina** (`components/CookingMode.tsx`): dalla scheda ricetta,
    schermata a tutto schermo con un passo alla volta (avanti/indietro,
    "Passo 3 di 7"), testo grande. Screen Wake Lock API con feature-detection
    (`'wakeLock' in navigator`) e fallback silenzioso dove non è supportata;
    si ri-richiede il lock al ritorno di visibilità della scheda, perché il
    browser lo rilascia da solo quando vai in background. Se un passo
    contiene un tempo (es. "3-4 minuti"), un pulsante avvia un timer per quel
    passo (usa il numero più alto in un intervallo). Eventi
    `cooking_mode_started`/`cooking_mode_completed` in
    `lib/analytics-events.ts`. Montata con `createPortal` su `document.body`,
    non come figlio diretto nell'albero: un antenato qualunque con un
    transform CSS (anche il residuo innocuo delle classi `animate-in` di
    Tailwind su `RecipeCard`) intrappola un discendente `position: fixed`
    dentro il proprio riquadro invece di fargli coprire tutto lo schermo —
    bug trovato testando dal vivo (l'overlay copriva ~327×834px invece del
    viewport), il portale lo evita indipendentemente da dove verrà montato
    questo componente in futuro. **Pattern da riusare**: qualunque futuro
    overlay/modale "a schermo intero" va portato su `document.body`, non
    dato per scontato che `fixed` basti.
21. **Sostituzione ingrediente mancante** (`app/api/substitute/route.ts` +
    `components/RecipeCard.tsx`): accanto a ogni ingrediente mancante, un
    link "non ce l'ho →". Propone fino a 2 alternative scelte SOLO tra gli
    ingredienti già in dispensa (non genera mai "vai a comprare X"), e
    riscrive i passi che nominano l'ingrediente mancante per usare
    l'alternativa. Se nessun ingrediente in dispensa è un sostituto sensato,
    lo dice esplicitamente invece di inventarne uno (`found: false`). Una
    sostituzione riuscita toglie l'ingrediente da `missingIngredients` sulla
    ricetta a schermo: altrimenti resterebbe comunque nella lista della
    spesa una volta pianificata la ricetta (vedi `lib/useShoppingList.ts`),
    anche se ormai esiste un modo per farne a meno. La riga resta comunque
    visibile in `RecipeCard` con l'esito (non scompare): il componente tiene
    un elenco "congelato" al primo render (`useState(recipe.missingIngredients)`)
    apposta per questo. Stesso pattern Zod + `zodOutputFormat` +
    `client.messages.parse()` di `app/api/recipe/route.ts`, passa da
    `rateLimit()` come tutte le rotte AI.
    - **Bug trovato testando dal vivo**: `<RecipeCard>` e `<RecipeFeedback>`
      sono fratelli diretti nello stesso genitore in `RecipeFinder.tsx` — a
      entrambi era stata data la stessa `key={recipeKey}` (per resettare lo
      stato locale a ogni nuova ricetta), e React ha segnalato "same key" in
      console. L'effetto pratico: lo stato dei due componenti si confondeva
      a runtime, e il messaggio di esito della sostituzione non compariva
      mai. Corretto dando a `RecipeCard` una key con prefisso distinto
      (`` `recipe-${recipeKey}` ``). **Pattern da riusare**: quando due
      elementi fratelli nello stesso genitore hanno bisogno di resettarsi
      alla stessa "generazione" di dati, la key deve comunque essere
      univoca tra loro, non solo stabile nel tempo — un valore numerico
      condiviso nudo è un rischio concreto, non solo teorico.
22. **Chiarezza kcal + ingredienti che si "sdoppiano"** (ripresa Fase 8,
    dettagli notati preparando la demo investitori): le kcal erano già
    calcolate per persona in `app/api/recipe/route.ts` (non totali per
    l'intero piatto), ma l'interfaccia non lo diceva da nessuna parte —
    corretto in `components/PreferencesPanel.tsx` ("Calorie massime a
    persona") e `components/RecipeCard.tsx` ("🔥 X kcal a persona"), nessuna
    modifica al prompt. Separatamente, testando dal vivo la ricetta segnava
    a volte "Olio" o "Sale"/"Pepe" come mancanti anche quando in dispensa
    c'erano "olio d'oliva" o "Sale e pepe" — l'AI non collegava nomi
    generici e specifici tra loro. Corretto con un'istruzione esplicita nel
    prompt di `app/api/recipe/route.ts` ("controlla se è già coperto da un
    nome leggermente diverso"), verificato con chiamate AI reali
    riproducendo entrambi i casi. **Pattern da riusare**: quando serve che
    l'AI confronti il proprio output con l'input ricevuto (qui: due liste
    di nomi ingrediente), un'istruzione esplicita di matching nel prompt è
    più affidabile che sperare in un ragionamento implicito.
23. **Consumo più realistico dopo aver pianificato** (`lib/usePantry.ts:applyRecipeUsage`):
    prima, ogni ingrediente selezionato per generare la ricetta veniva
    spento (a meno di avere una quantità tracciata), anche se la ricetta ne
    usava solo un po' (una noce di burro) o non lo usava affatto (ketchup e
    maionese selezionati ma ignorati dalla ricetta) — costringendo a
    riaccenderli a mano ogni volta, l'attrito che la dispensa persistente
    doveva togliere. Ora si spengono solo gli ingredienti **tracciati** che
    arrivano davvero a zero; quelli non tracciati (farina, olio, ketchup...)
    non vengono più spenti in automatico, punto — restano disponibili
    finché non li spegni tu. Ha reso `deselectMany` completamente inutilizzato
    (nessun chiamante in tutto il codebase): rimosso insieme al ramo
    corrispondente in `app/api/pantry/route.ts` invece di lasciarlo morto.
24. **Dispensa più capiente**: `MAX_ITEMS` da 60 a 150 (`lib/usePantry.ts` e
    `app/api/pantry/route.ts`, tenuti in sync a mano — è un singolo numero).
25. **"Di cosa hai voglia?"** (`components/CravingInput.tsx`): campo di
    testo libero e opzionale, sempre visibile sopra "Trova una ricetta" (non
    dentro "Personalizza" — l'obiettivo è ispirare, deve essere facile da
    trovare). Il testo diventa un'istruzione aggiuntiva nel prompt di
    `app/api/recipe/route.ts`: se in conflitto con gli ingredienti
    disponibili, questi restano il vincolo principale. Nessuna modifica allo
    schema della ricetta. Evento `craving_used` tracciato solo quando il
    campo non è vuoto — **senza il testo libero digitato**, per non
    raccogliere frasi scritte dalla persona nemmeno in forma aggregata.

16. **Demo Blendit Pro** (`/pro`): pagina statica di vendita per i
    nutrizionisti. Tre atti (il tuo piano → il paziente cucina → cosa vedi
    tu), vista paziente e cruscotto affiancati sopra i 900px e alternati
    con un selettore sotto. Nessun account, nessun salvataggio, nessuna
    chiamata AI: i dati finti stanno tutti in `lib/proDemoData.ts`.
    Volutamente **non collegata** dall'app consumer e non indicizzata.
    Progetto e motivazioni in `PROGETTO_NUTRIZIONISTI.md` §5bis.

26. **Import piano reale** (`/pro/demo`, `app/api/pro-demo-import/route.ts`):
    pagina isolata (Fase 0.3 di `PROGETTO_NUTRIZIONISTI.md`) diversa da
    `/pro` — qui si carica un PDF o una foto vera di un piano alimentare e
    l'AI lo struttura in giorni/pasti/alimenti sul momento, per usarla
    durante un'intervista con un nutrizionista vero. Stesso pattern Zod +
    `zodOutputFormat` + `client.messages.parse()` delle altre rotte AI,
    passa da `rateLimit()`. Se il documento non è un piano leggibile lo
    dice esplicitamente (`recognized: false` + motivo), non inventa una
    struttura. Nessun salvataggio: il file vive solo per la durata della
    chiamata. Nessun account, nessun collegamento da `/pro` o dall'app
    consumer, non indicizzata.

27. **Personalizzazione della demo `/pro`** (`components/pro/ProPersonalizePanel.tsx`):
    prima di mostrarla a un nutrizionista specifico, si possono impostare
    nome del nutrizionista, nome del paziente e i tre numeri del riepilogo
    (pasti registrati, pasti totali, sostituzioni) al posto dei valori
    finti di default. I valori vivono nell'URL della pagina (query string),
    non su un database: copiare il link basta a mandarlo già personalizzato.
    Riepilogo e iniziali del paziente si ricalcolano da questi valori
    (`lib/proDemoData.ts: buildSummary`, `buildStats`, `getInitials`) così
    restano sempre coerenti tra loro. Il badge "Demo · dati di esempio"
    resta comunque sempre visibile — personalizzata o no, la demo dichiara
    di non essere reale.

28. **Demo `/pro` resa interattiva**: l'atto "Il tuo piano" ha un vero
    chatbot (`components/pro/ProPlanChat.tsx` + `app/api/pro-demo-chat/route.ts`,
    unica chiamata AI reale su `/pro` — tutto il resto resta statico) che
    risponde a domande di sostituzione restando dentro le equivalenze già
    definite dal nutrizionista e una dispensa finta (`DEMO_PANTRY` in
    `lib/proDemoData.ts`), mai inventando una regola nuova (coerente con
    §2.1 di `PROGETTO_NUTRIZIONISTI.md`: l'AI non decide mai il piano).
    L'atto "Il paziente cucina" ha passi navigabili 1-6 (avanti/indietro,
    stesso pattern di `components/CookingMode.tsx`), "Salta" che non
    registra nulla e non tocca il cruscotto (§2.3), e "Scrivi due righe"
    che invia davvero una nota visibile sul telefono del paziente. L'atto
    "Cosa vedi tu" ha la statistica "Sostituzioni" cliccabile per
    espandere qualche esempio, senza mai richiedere una risposta (resta
    vero "Messaggi a te: 0").

29. **Piano nutrizionale reale (funzione consumer)** — `components/NutritionPlanPanel.tsx`,
    `lib/useNutritionPlan.ts`, `app/api/nutrition-plan/route.ts`,
    `app/api/plan-recipe/route.ts`: si importa il piano scritto dal proprio
    nutrizionista (PDF o foto), viene strutturato dall'AI e salvato in modo
    anonimo per dispositivo (tabella `nutrition_plan`, stesso pattern di
    dispensa/piano pasti — un nuovo import sostituisce per intero quello
    precedente). Per ogni pasto del piano, un pulsante genera una vera
    `Recipe` che lo realizza privilegiando quello che c'è già in dispensa
    (stesso schema di `app/api/recipe/route.ts`, quindi `RecipeCard`,
    modalità cucina, "aggiungi al piano" e lista della spesa funzionano
    già, zero modifiche); gli alimenti prescritti assenti dalla dispensa
    finiscono in `missingIngredients` **senza il limite di 2** della
    generazione libera, perché qui riflette il piano reale, non un piatto
    inventato. La sostituzione riusa `app/api/substitute/route.ts` così
    com'è. La logica di lettura del documento è condivisa con la demo
    `/pro/demo` tramite `lib/planImport.ts`, per non mantenerla in due
    posti. Testato dal vivo: riconosce correttamente "pollo" prescritto
    come già coperto da "Petto di pollo" in dispensa, segnalando solo
    "pasta integrale" come davvero mancante.

## Decisioni architetturali importanti (il "perché")

- **Structured output via Zod invece di "chiedi JSON nel prompt"**: più
  affidabile, niente parsing fragile di testo che potrebbe contenere
  markdown o prosa extra. Vedi il pattern in `app/api/recipe/route.ts`.
- **Supabase sì, auth no**: dispensa, piano pasti e lista della spesa
  vivono su Supabase (persistenza vera, sopravvive alla cancellazione
  dei dati del browser), ma restano anonime — un id per dispositivo
  (`lib/deviceId.ts`), non un account. RLS attiva senza policy su ogni
  tabella: solo la service-role key (server-only) può leggere/scrivere,
  vedi `supabase/schema.sql`. Il login vero resta rimandato (vedi
  CLAUDE.md), come passo successivo separato della roadmap.
- **Vetrina B2B non funzionale**: costruire un pulsante "Acquista"
  vero senza un partner commerciale reale rischierebbe di far credere
  a un investitore che quella partnership esista già.
- **`git branch -m master main`** fatto prima del primo push, per
  convenzione moderna GitHub (utile visto che il team è in 5).
- Su Windows, dopo aver installato Node.js via winget, il PATH di
  sistema non si aggiorna nelle sessioni di terminale già aperte (va
  riletto da registro o riaperto un terminale nuovo) — non è un
  problema del progetto, solo una nota se capita di nuovo in futuro.
- **Stesso problema di PATH, versione Claude Code**: lo strumento di
  anteprima browser di Claude Code lancia processi con un PATH che non
  include Node.js. `BLENDIT/.claude/launch.json` (attenzione: cartella
  superiore, non `blendit-app/.claude/`) risolve il problema lanciando
  `cmd.exe /c "set PATH=C:\Program Files\nodejs;%PATH% && npm --prefix
  blendit-app run dev"` invece del solo `npm run dev` — tentativi più
  diretti (`npm.cmd` o `node.exe` come eseguibile, senza passare da
  `cmd.exe`) falliscono perché anche i processi figli (npm → next)
  ereditano il PATH incompleto.
- **Il server di sviluppo va riavviato ogni tanto**: dopo molte ore/giorni
  di hot-reload continuo (Fast Refresh/Turbopack) può diventare instabile
  e ricaricarsi da solo ripetutamente, perdendo aggiornamenti di stato in
  corso (es. timer di un debounce) — capitato una volta con un processo
  acceso da più di un giorno. Se qualcosa non si salva più / la pagina si
  ricarica da sola senza motivo, prova prima a riavviarlo.

## Cosa NON c'è (di proposito, per ora)

Autenticazione utente (login/account veri — c'è Supabase ma resta
anonimo, vedi sopra), pagamenti o integrazioni B2B funzionanti, lato
fashion, internazionalizzazione (solo italiano). Vedi CLAUDE.md →
"Cosa NON fare" per la lista aggiornata e il perché di ciascuna.

## Deploy

- Repo: https://github.com/gp11-p/blendit-app (privato)
- Produzione: https://blendit-app.vercel.app (auto-deploy ad ogni push
  su `main`; `ANTHROPIC_API_KEY` configurata nelle Environment
  Variables del progetto Vercel, non nel repo)

## Idee proposte ma non ancora costruite

Vivono in `IDEE.md` in questa stessa cartella (il "quaderno delle idee":
cosa è già deciso, cosa è parcheggiato e perché, cosa è stato scartato e
perché). Non implementare nulla da lì senza che Giuseppe lo chieda
esplicitamente.

## Da fare prima di far testare l'app (checklist)

1. `npm install` serve (da quando c'è Supabase: `@supabase/supabase-js`
   è l'unica dipendenza esterna aggiunta finora, di proposito tenuta al
   minimo).
2. **Imposta uno spending limit mensile sulla console Anthropic** (es. €30).
   È l'unico vero freno di emergenza: il rate limiter in memoria non
   condivide i contatori tra istanze serverless.
3. `npx tsc --noEmit` e `npm run lint` da PowerShell.
4. `npm run dev` e prova il giro completo a 375px: aggiungi ingredienti →
   ricetta → aggiungi al piano → apri "Il mio piano" → spunta un articolo
   della lista → verifica che finisca in dispensa.
5. Da telefono vero (dopo il deploy): verifica "Aggiungi a Home" su Android
   e su iPhone, e la condivisione su WhatsApp.
6. Fotografa un frigo vero e controlla che le quantità stimate per gli
   ingredienti numerabili (uova, zucchine...) siano ragionevoli — **fatto**,
   vedi punto 19 più sopra.

## Prossimi passi possibili

- Modalità cucina e sostituzione ingrediente mancante (punti 20-21) sono
  **fatte**, testate dal vivo e pushate su `main`.
- Fase 8 della guida originale: preparazione demo investitori (test da
  altro dispositivo, video di backup, ricette "sicure" pre-testate) —
  attualmente in pausa, demo saltata per andare avanti con la roadmap.
- Roadmap "dopo la demo" (guida, sezione 14): Supabase per persistenza
  vera → **fatto** → login → app Flutter → lato fashion → B2B reale →
  analytics → push notifications. Un progetto alla volta.
