# Blendit App — Stato del progetto

Questo file esiste per far ripartire velocemente una **nuova sessione di
Claude Code** (nuova finestra di contesto) su questo progetto, senza dover
rileggere tutto da zero. Aggiornalo quando il progetto cambia in modo
sostanziale — altrimenti diventa fuorviante invece che utile.

Per il contesto di stile/regole che Claude Code legge automaticamente,
vedi `CLAUDE.md` in questa stessa cartella. Per la roadmap originale a
8 fasi, vedi `GUIDA_SVILUPPO_APP.md` nella cartella superiore (`BLENDIT/`).

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
- Nessun database, nessuna autenticazione (vedi sezione "Cosa NON c'è").

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
  preferences.ts           — opzioni (TIME/DIET/DISH_TYPE/SERVINGS) + default
  useMealPlan.ts            — hook per il piano pasti (localStorage)
  utils.ts                  — cn() (da shadcn)
```

## Funzionalità implementate (tutte testate con chiamate AI reali, non mock)

1. **Input ingredienti**: manuale (chip rimovibili) o foto (visione AI,
   compressione lato client se >2MB via Canvas API nativa).
2. **Generazione ricetta**: titolo, tempo, difficoltà, calorie per
   porzione, numero di porzioni (con quantità negli step scalate di
   conseguenza), ingredienti mancanti, passi.
3. **Preferenze** (pannello "Personalizza", collassato di default):
   tempo massimo, dieta (multi-select), porzioni, tipo di piatto. Se
   l'utente non tocca nulla, la richiesta si comporta come senza
   preferenze (nessun vincolo forzato nel prompt).
4. **Rigenera ricetta**: pulsante "prova un'altra ricetta" — tiene
   traccia degli ultimi 5 titoli mostrati in sessione e istruisce l'AI
   a non ripeterli.
5. **Piano pasti settimanale**: si salva una ricetta su un giorno della
   settimana; persiste in `localStorage` (non un vero database — resta
   solo su quel dispositivo/browser). Pattern SSR-safe: stato iniziale
   vuoto, popolato via `useEffect` dopo il mount per evitare mismatch
   di hydration (vedi commento in `lib/useMealPlan.ts`).
6. **Vetrina prodotti partner**: per ogni ingrediente mancante, una
   card "presto disponibile" — nessun pulsante di acquisto, nessuna
   integrazione B2B reale dietro. Scelta deliberata per non promettere
   a un investitore una partnership che non esiste (vedi CLAUDE.md).
7. **Polish UI**: shimmer/skeleton durante il caricamento (non uno
   spinner generico), fade-in della ricetta, empty state illustrato,
   palette brand, mobile-first (testato sempre a 375px e 1440px).

8. **Dispensa persistente** (`lib/usePantry.ts`): gli ingredienti non sono
   più uno stato temporaneo, restano in `localStorage`. I chip "accesi"
   entrano nella ricetta, quelli spenti restano in dispensa ma vengono
   ignorati. Toglie il motivo principale per cui nessuno tornava una
   seconda volta (ridigitare ogni volta le stesse cose).
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

## Decisioni architetturali importanti (il "perché")

- **Structured output via Zod invece di "chiedi JSON nel prompt"**: più
  affidabile, niente parsing fragile di testo che potrebbe contenere
  markdown o prosa extra. Vedi il pattern in `app/api/recipe/route.ts`.
- **Niente database, niente auth**: per scelta esplicita (vedi
  CLAUDE.md), rimandato a dopo la demo investitori. Il piano pasti usa
  `localStorage` come compromesso leggero — è persistenza, ma non un
  backend.
- **Vetrina B2B non funzionale**: costruire un pulsante "Acquista"
  vero senza un partner commerciale reale rischierebbe di far credere
  a un investitore che quella partnership esista già.
- **`git branch -m master main`** fatto prima del primo push, per
  convenzione moderna GitHub (utile visto che il team è in 5).
- Su Windows, dopo aver installato Node.js via winget, il PATH di
  sistema non si aggiorna nelle sessioni di terminale già aperte (va
  riletto da registro o riaperto un terminale nuovo) — non è un
  problema del progetto, solo una nota se capita di nuovo in futuro.

## Cosa NON c'è (di proposito, per ora)

Autenticazione utente, database vero/backend persistente, pagamenti o
integrazioni B2B funzionanti, lato fashion, internazionalizzazione
(solo italiano). Vedi CLAUDE.md → "Cosa NON fare" per la lista
aggiornata e il perché di ciascuna.

## Deploy

- Repo: https://github.com/gp11-p/blendit-app (privato)
- Produzione: https://blendit-app.vercel.app (auto-deploy ad ogni push
  su `main`; `ANTHROPIC_API_KEY` configurata nelle Environment
  Variables del progetto Vercel, non nel repo)

## Idee proposte ma non ancora costruite

Discusse con l'utente, in attesa di priorità:
- Sostituzione ingrediente mancante ("non hai la mozzarella? prova con...")
- Condividi/copia la ricetta (Web Share API o clipboard, no backend)
- Lista della spesa generata dal piano pasti settimanale (unisce le
  `missingIngredients` di tutte le ricette pianificate — si collega
  bene sia al piano pasti che alla vetrina prodotti già esistenti)
- Modalità "cucina" — un passo alla volta con timer
- Valutazione rapida della ricetta (👍/👎, solo in sessione, per
  affinare il "prova un'altra")

## Da fare prima di far testare l'app (checklist)

1. `npm install` non serve: non sono state aggiunte dipendenze (tutto è
   scritto senza librerie esterne, di proposito).
2. **Imposta uno spending limit mensile sulla console Anthropic** (es. €30).
   È l'unico vero freno di emergenza: il rate limiter in memoria non
   condivide i contatori tra istanze serverless.
3. `npx tsc --noEmit` e `npm run lint` da PowerShell.
4. `npm run dev` e prova il giro completo a 375px: aggiungi ingredienti →
   ricetta → aggiungi al piano → apri "Il mio piano" → spunta un articolo
   della lista → verifica che finisca in dispensa.
5. Da telefono vero (dopo il deploy): verifica "Aggiungi a Home" su Android
   e su iPhone, e la condivisione su WhatsApp.

## Prossimi passi possibili

- Fase 8 della guida originale: preparazione demo investitori (test da
  altro dispositivo, video di backup, ricette "sicure" pre-testate)
- Roadmap "dopo la demo" (guida, sezione 14): Supabase per
  persistenza vera → login → app Flutter → lato fashion → B2B reale →
  analytics → push notifications. Un progetto alla volta.
