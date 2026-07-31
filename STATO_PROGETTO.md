# Blendit App — Stato del progetto

Questo file esiste per far ripartire velocemente una **nuova sessione di
Claude Code** (nuova finestra di contesto) su questo progetto, senza dover
rileggere tutto da zero. Aggiornalo quando il progetto cambia in modo
sostanziale — altrimenti diventa fuorviante invece che utile.

Per il contesto di stile/regole che Claude Code legge automaticamente,
vedi `CLAUDE.md` in questa stessa cartella. Per la roadmap originale a
8 fasi, vedi `GUIDA_SVILUPPO_APP.md` nella cartella superiore (`BLENDIT/`).

---

## ⚠️ Se riprendi da qui, leggi prima questo

**C'è lavoro fatto e testato ma non ancora committato.** `git status` in
`blendit-app/` mostra 12 file modificati, tutti per la funzionalità
"Inventario con quantità" (punto 19 più sotto): `lib/types.ts`,
`lib/usePantry.ts`, `app/api/pantry/route.ts`, `app/api/recipe/route.ts`,
`app/api/vision/route.ts`, `components/PantryChip.tsx`,
`components/PantryPanel.tsx`, `components/PhotoInput.tsx`,
`components/RecipeFinder.tsx`, `supabase/schema.sql`,
`app/privacy/page.tsx`, e questo stesso file.

- `npx tsc --noEmit` e `npm run lint` puliti.
- Testato dal vivo con una chiamata AI reale: genera una ricetta, aggiungila
  al piano, gli ingredienti tracciati (es. zucchine, petto di pollo) si
  decrementano correttamente invece di spegnersi del tutto.
- **Non testato**: la stima delle quantità da una foto reale (nessuna foto
  disponibile in quella sessione) — prima cosa da provare se riprendi da qui.
- Se il codice sopra ti sembra a posto, il prossimo passo naturale è
  chiedere conferma ed eseguire i commit (atomici, uno per pezzo logico,
  come nelle altre volte — vedi `git log` per lo stile) e poi il push.
- **Il server di sviluppo locale**: quello "storico" (acceso da giorni,
  ereditato da sessioni precedenti) è stato fermato perché era diventato
  instabile (si ricaricava da solo, perdendo aggiornamenti in corso). Se
  Claude Code lo riavvia tramite lo strumento di anteprima browser, usa
  `.claude/launch.json` nella cartella `BLENDIT/` (non `blendit-app/`) —
  vedi la nota sul PATH di Node in "Decisioni architetturali" più sotto,
  già risolta lì dentro.

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
  PartnerProductsPreview.tsx — vetrina "presto disponibile" (NON funzionale)
  ui/                      — primitive shadcn (button, card, input, skeleton, collapsible)

lib/
  types.ts                — Recipe, Preferences e tipi correlati
  preferences.ts           — opzioni (TIME/DIET/DISH_TYPE/SERVINGS/CALORIE) + default
  usePantry.ts              — hook dispensa (Supabase, vedi sotto)
  useMealPlan.ts            — hook piano pasti (Supabase; MEAL_TYPES pranzo/cena)
  useShoppingList.ts        — hook lista della spesa (Supabase)
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
   ingredienti numerabili (uova, zucchine...) siano ragionevoli — non
   ancora testato con una foto reale (vedi avviso in cima al file).

## Prossimi passi possibili

- **Subito**: commit + push del lavoro descritto in cima al file (in
  attesa di conferma di Giuseppe).
- Da `IDEE.md`, già segnate 🟢 "Prossima" con prompt pronto in
  `../ISTRUZIONI_CLAUDE_CODE.md`: Modalità cucina, Sostituzione
  ingrediente mancante. Non partire senza che Giuseppe lo chieda.
- Fase 8 della guida originale: preparazione demo investitori (test da
  altro dispositivo, video di backup, ricette "sicure" pre-testate) —
  attualmente in pausa, demo saltata per andare avanti con la roadmap.
- Roadmap "dopo la demo" (guida, sezione 14): Supabase per persistenza
  vera → **fatto** → login → app Flutter → lato fashion → B2B reale →
  analytics → push notifications. Un progetto alla volta.
