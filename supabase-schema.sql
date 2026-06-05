-- Catalogue produits
create table produits (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  pcb numeric not null default 1,
  unite text not null default 'kg',
  categorie text default '',
  created_at timestamptz default now()
);

-- Bons de commande vente
create table bons_commande_vente (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  date date not null,
  client_id uuid,
  client_nom text not null default 'Vindemia Logistique',
  lignes jsonb not null default '[]',
  statut text not null default 'confirme',
  total_bc numeric not null default 0,
  bl_id uuid,
  created_at timestamptz default now()
);

-- Bons de livraison vente
create table bons_livraison_vente (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  date date not null,
  bc_id uuid references bons_commande_vente(id) on delete set null,
  bc_numero text not null default '',
  client_nom text not null default 'Vindemia Logistique',
  lignes jsonb not null default '[]',
  total_bl numeric not null default 0,
  created_at timestamptz default now()
);

-- Référence BL dans BC (après création des 2 tables)
alter table bons_commande_vente add constraint fk_bl_vente
  foreign key (bl_id) references bons_livraison_vente(id) on delete set null;

-- Bons de commande achat
create table bons_commande_achat (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  date date not null,
  fournisseur text not null,
  lignes jsonb not null default '[]',
  total_achat numeric not null default 0,
  total_vente numeric not null default 0,
  marge_totale numeric not null default 0,
  created_at timestamptz default now()
);

-- Permissions
grant all on produits to anon, authenticated;
grant all on bons_commande_vente to anon, authenticated;
grant all on bons_livraison_vente to anon, authenticated;
grant all on bons_commande_achat to anon, authenticated;
