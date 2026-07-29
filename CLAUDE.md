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
- Non aggiungere autenticazione utente.
- Non aggiungere database.
- Non aggiungere pagamenti.
- Non aggiungere il lato fashion.
- Non aggiungere internazionalizzazione (per ora solo italiano).
Tutte queste cose verranno dopo la demo agli investitori.

## API key
La API key Anthropic è in .env.local (variabile ANTHROPIC_API_KEY).
Il file .env.local è in .gitignore, non deve mai finire su GitHub.

## Guida di riferimento completa
La roadmap completa a 8 fasi (di cui questo bootstrap è la Fase 1) vive in
GUIDA_SVILUPPO_APP.md nella cartella superiore (BLENDIT/), insieme a
pitch deck, script e piano finanziario.
