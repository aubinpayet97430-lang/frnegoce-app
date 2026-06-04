export type Unite = 'kg' | 'unite' | 'caisse'

export interface LigneProduit {
  id: string
  nom: string
  quantite: number
  prix: number
  unite: Unite
}

export interface BonCommande {
  id: string
  numero: string
  date: string
  lignes: LigneProduit[]
  bl_id?: string
  created_at: string
}

export interface BonLivraison {
  id: string
  numero?: string
  date: string
  photo_url: string
  bc_id?: string
  created_at: string
}
