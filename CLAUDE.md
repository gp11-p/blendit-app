@AGENTS.md

# Blendit App — Contesto per Claude

## Cos'è Blendit
Blendit è una web app che risolve la "decision fatigue" quotidiana:
- Lato food: l'utente inserisce cosa ha in frigo (testo o foto), l'AI
  suggerisce una ricetta personalizzata da cucinare stasera.
- Lato fashion (fase 2): l'utente carica il guardaroba, l'AI compone outfit.

Modello di business: subscription B2C + commissioni B2B con partner
supermercati e retail moda ("one-tap purchase" per ingredienti/pezzi
mancanti).

## Team e utente attuale
Team: 5 ingegneri Master in Informatica, University of Lleida (Erasmus).
User principale che chatta con te qui: Giuseppe Pirrelli. Livello coding:
principiante. Vuole capire cosa fa il codice, non solo che funzioni.
Comunica in italiano. Spiegazioni sempre in italiano, codice/commenti
in inglese.

## Stack
- Next.js 16 (App Router), TypeScript — vedi AGENTS.md sopra: questa versione
  ha breaking changes rispetto a versioni precedenti, controlla
  node_modules/next/dist/docs/ prima di usare API che non sei sicuro
  siano ancora valide.
- Tailwind CSS v4 + shadcn/ui
- Anthropic SDK (@anthropic-ai/sdk), modello claude-sonnet-5 per la
  generazione ricette e per l'analisi foto (vision)
- Vercel per deploy

## Palette brand (usa CSS variables Tailwind)
- primary (berry): #7A1A4F
- secondary (magenta): #A8336E
- accent (green): #2BA86E
- ink dark: #3E0E26 (per slide/backup scure)
- text-dark: #2B2330
- text-muted: #857A82
- background: #FFFFFF
- rose tint (per blocchi light): #F6E8F0

## Regole di stile del codice
- Componenti in TSX, un componente per file, nome PascalCase.
- Server components di default; use "use client" solo dove necessario.
- API routes in app/api/*/route.ts.
- Tipizza sempre (evita `any`).
- Prima di scrivere codice complesso, descrivi in italiano il piano
  al programmatore e chiedi conferma.
- Commit atomici con messaggi in inglese, imperativi ("add photo upload").
- Mobile-first: testa sempre a 375px di larghezza prima che a desktop.

## Cosa NON fare (per ora)
- Non aggiungere autenticazione utente (login/signup): dispensa, piano pasti
  e lista della spesa vivono già su un vero backend (Supabase — vedi sotto),
  ma restano anonime, identificate solo da un id per dispositivo, non da un
  account. Il login vero è il passo successivo della roadmap, non ancora
  questo.
- Non aggiungere pagamenti o integrazioni B2B funzionanti (la vetrina
  prodotti partner in app è solo un'anteprima visiva "presto disponibile",
  senza acquisto reale — vedi sotto).
- Non aggiungere il lato fashion. Decisione presa il 30/07/2026: ci si
  concentra solo sul food finché il ritorno a 7 giorni non supera il 20%.
- Non aggiungere internazionalizzazione (per ora solo italiano).
Tutte queste cose verranno dopo la fase di test con utenti reali.

## Regole da non violare mai (protezione e privacy)
Queste non sono preferenze di stile: se salta una di queste, salta il
budget o la conformità legale del progetto.

- **Ogni endpoint che chiama l'AI deve passare da `rateLimit()`**
  (`lib/rateLimit.ts`). Una nuova rotta API senza limite espone la API key
  personale a un abuso da centinaia di euro.
- **Nessun cookie e nessun banner cookie.** La misurazione usa un ID
  casuale in localStorage. È una scelta di prodotto, non un dettaglio.
- **Nessuna profilazione pubblicitaria, nessun profilo per persona.**
  Le preferenze alimentari sotto GDPR possono rivelare salute (celiachia)
  e religione (halal/kasher): sono dati di categoria particolare, art. 9.
  Gli eventi restano anonimi e aggregati.
- **Gli eventi tracciabili sono una lista chiusa** in
  `lib/analytics-events.ts`. Non inviare stringhe libere a `/api/track`.
- **Il service worker (`public/sw.js`) non deve fare cache.** Serve solo a
  rendere l'app installabile. Aggiungere cache senza versionamento è la
  causa numero uno di "ho pubblicato ma vedo la versione vecchia".
- Se una modifica tocca cosa viene raccolto o conservato, va aggiornata
  anche `app/privacy/page.tsx`, che oggi descrive fedelmente la realtà.

## Quaderno delle idee
Le idee di sviluppo, crescita e business — incluse quelle scartate con il
relativo motivo — stanno in IDEE.md in questa cartella. È un magazzino, non
una lista di cose da fare: non implementare niente da lì se Giuseppe non lo
chiede esplicitamente.

## Stato attuale del progetto
Per l'elenco completo e aggiornato delle funzionalità già costruite, la
struttura dei file, e le decisioni architetturali con il relativo
"perché", vedi STATO_PROGETTO.md in questa stessa cartella — è il primo
file da leggere in una nuova sessione per capire dove siamo arrivati.

## API key
La API key Anthropic è in .env.local (variabile ANTHROPIC_API_KEY).
Il file .env.local è in .gitignore, non deve mai finire su GitHub.

## Guida di riferimento completa
La roadmap completa a 8 fasi (di cui questo bootstrap è la Fase 1) vive in
GUIDA_SVILUPPO_APP.md nella cartella superiore (BLENDIT/), insieme a
pitch deck, script e piano finanziario.
