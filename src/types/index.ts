export type Unite = 'kg' | 'unite' | 'caisse'
export type StatutBC = 'brouillon' | 'confirme' | 'livre'

export interface Produit {
  id: string
  nom: string
  pcb: number
  unite: Unite
  categorie?: string
  created_at: string
}

export interface Client {
  id: string
  nom: string
  contact?: string
  email?: string
  telephone?: string
  created_at: string
}

export interface LigneCommande {
  produit_id?: string
  nom_produit: string
  quantite_caisses: number
  pcb: number
  unite: Unite
  prix_unitaire: number
  total: number
}

export interface LigneBL {
  nom_produit: string
  quantite_caisses: number
  pcb: number
  unite: Unite
  prix_unitaire: number
  total: number
}

export interface BonCommandeVente {
  id: string
  numero: string
  date: string
  client_id: string
  client_nom: string
  lignes: LigneCommande[]
  statut: StatutBC
  total_bc: number
  bl_id?: string
  created_at: string
}

export interface BonLivraisonVente {
  id: string
  numero: string
  date: string
  bc_id: string
  bc_numero: string
  client_nom: string
  lignes: LigneBL[]
  total_bl: number
  created_at: string
}

export interface LigneAchat {
  produit_id?: string
  nom_produit: string
  quantite_caisses: number
  pcb: number
  unite: Unite
  prix_achat: number
  prix_vente: number
  marge: number
  total_achat: number
  total_vente: number
}

export interface BonCommandeAchat {
  id: string
  numero: string
  date: string
  fournisseur: string
  lignes: LigneAchat[]
  total_achat: number
  total_vente: number
  marge_totale: number
  created_at: string
}
