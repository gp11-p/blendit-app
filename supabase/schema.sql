-- Blendit: schema per la persistenza vera (dispensa, piano pasti, lista spesa).
--
-- Da eseguire una volta nell'SQL Editor del progetto Supabase. Non c'e'
-- login: owner_id e' un id anonimo generato dal browser (lib/deviceId.ts),
-- non un vero account. Le uniche righe che possono leggerlo/scriverlo sono
-- le API routes del progetto, tramite la service-role key (mai esposta al
-- client) - vedi lib/supabaseServer.ts e lib/ownerId.ts.
--
-- RLS e' attiva su tutte e tre le tabelle ma senza nessuna policy: e' una
-- rete di sicurezza gratuita. Anche se in futuro la chiave pubblica "anon"
-- finisse per errore nel bundle client, nessuno potrebbe comunque leggere o
-- scrivere righe, perche' solo la service-role key bypassa RLS.

create table pantry_items (
  owner_id text not null,
  normalized_name text not null,
  name text not null,
  selected boolean not null default true,
  quantity integer check (quantity is null or quantity >= 0), -- conteggio per ingredienti numerabili; NULL = non tracciato
  added_at timestamptz not null default now(),
  primary key (owner_id, normalized_name)
);
alter table pantry_items enable row level security;

create table meal_plan (
  id text primary key,              -- formato invariato: "<Giorno>-<uuid>"
  owner_id text not null,
  day text not null,
  recipe jsonb not null,             -- l'intero oggetto Recipe, letto/scritto in blocco
  meal_type text,                    -- "Pranzo" | "Cena"; NULL se non specificato
  created_at timestamptz not null default now()
);
create index meal_plan_owner_id_idx on meal_plan (owner_id);
alter table meal_plan enable row level security;

create table shopping_checked (
  owner_id text primary key,
  checked_keys text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table shopping_checked enable row level security;
