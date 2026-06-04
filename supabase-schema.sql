-- Tables
create table bons_commande (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  date date not null,
  lignes jsonb not null default '[]',
  bl_id uuid,
  created_at timestamptz default now()
);

create table bons_livraison (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  photo_url text not null,
  bc_id uuid references bons_commande(id) on delete set null,
  created_at timestamptz default now()
);

-- Ajout de la référence après création des deux tables
alter table bons_commande add constraint fk_bl foreign key (bl_id) references bons_livraison(id) on delete set null;

-- Storage bucket pour les photos de BL
insert into storage.buckets (id, name, public) values ('documents', 'documents', true);

-- Policies : utilisateurs connectés seulement
alter table bons_commande enable row level security;
alter table bons_livraison enable row level security;

create policy "auth users" on bons_commande for all using (auth.role() = 'authenticated');
create policy "auth users" on bons_livraison for all using (auth.role() = 'authenticated');

create policy "auth upload" on storage.objects for insert with check (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "public read" on storage.objects for select using (bucket_id = 'documents');
