'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { genNumero, formatEuro } from '@/lib/utils'
import { Unite } from '@/types'

interface Produit { id: string; nom: string; pcb: number; unite: Unite }
interface Ligne { id: string; produit_id: string; nom_produit: string; quantite_caisses: number; pcb: number; unite: Unite; prix_unitaire: number; total: number }

function newLigne(): Ligne {
  return { id: crypto.randomUUID(), produit_id: '', nom_produit: '', quantite_caisses: 0, pcb: 1, unite: 'caisse', prix_unitaire: 0, total: 0 }
}

export default function NouveauBCVentePage() {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [date_livraison, setDateLivraison] = useState('')
  const [lignes, setLignes] = useState<Ligne[]>([newLigne()])
  const [produits, setProduits] = useState<Produit[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const { data: p } = await supabase.from('produits').select('*').order('nom')
      setProduits(p || [])
    })
  }, [router])

  function selectProduit(ligneId: string, produitId: string) {
    const p = produits.find(p => p.id === produitId)
    setLignes(prev => prev.map(l => l.id === ligneId ? {
      ...l, produit_id: produitId, nom_produit: p?.nom || '', pcb: p?.pcb || 1, unite: p?.unite || 'caisse'
    } : l))
  }

  function updateLigne(id: string, field: string, value: string | number) {
    setLignes(prev => prev.map(l => {
      if (l.id !== id) return l
      const updated = { ...l, [field]: value }
      updated.total = updated.quantite_caisses * updated.pcb * updated.prix_unitaire
      return updated
    }))
  }

  const total = lignes.reduce((s, l) => s + l.total, 0)

  async function sauvegarder() {
    const valides = lignes.filter(l => l.nom_produit.trim() && l.quantite_caisses > 0)
    if (valides.length === 0) return
    setSaving(true)
    const supabase = createClient()
    const numero = genNumero('BC')
    const { data, error } = await supabase.from('bons_commande_vente').insert({
      numero, date, date_livraison: date_livraison || null, client_id: null, client_nom: 'Vindemia Logistique',
      lignes: valides.map(({ id: _, ...l }) => l),
      statut: 'confirme', total_bc: total
    }).select().single()
    if (!error && data) router.push(`/vente/bons-commande/${data.id}`)
    else { alert('Erreur : ' + error?.message); setSaving(false) }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nouveau BC</h1>
            <p className="text-sm text-gray-500">Vindemia Logistique</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de commande</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de livraison souhaitée</label>
            <input type="date" value={date_livraison} onChange={e => setDateLivraison(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {lignes.map((ligne, i) => (
            <div key={ligne.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Produit {i + 1}</span>
                {lignes.length > 1 && (
                  <button onClick={() => setLignes(p => p.filter(l => l.id !== ligne.id))} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Produit</label>
                  <div className="flex gap-2">
                    <select value={ligne.produit_id} onChange={e => selectProduit(ligne.id, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">-- Choisir du catalogue --</option>
                      {produits.map(p => <option key={p.id} value={p.id}>{p.nom} (PCB {p.pcb})</option>)}
                    </select>
                    <span className="text-xs text-gray-400 self-center">ou</span>
                    <input type="text" placeholder="Saisir librement" value={ligne.produit_id ? '' : ligne.nom_produit}
                      onChange={e => updateLigne(ligne.id, 'nom_produit', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nb caisses</label>
                    <input type="number" min="0" value={ligne.quantite_caisses || ''}
                      onChange={e => updateLigne(ligne.id, 'quantite_caisses', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">PCB</label>
                    <input type="number" min="1" value={ligne.pcb || ''}
                      onChange={e => updateLigne(ligne.id, 'pcb', parseFloat(e.target.value) || 1)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Unité</label>
                    <select value={ligne.unite} onChange={e => updateLigne(ligne.id, 'unite', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="kg">kg</option>
                      <option value="unite">unité</option>
                      <option value="caisse">caisse</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Prix / {ligne.unite}</label>
                    <input type="number" step="0.01" min="0" value={ligne.prix_unitaire || ''}
                      onChange={e => updateLigne(ligne.id, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                {ligne.total > 0 && (
                  <div className="bg-indigo-50 rounded-xl px-4 py-2.5 flex justify-between items-center">
                    <span className="text-xs text-indigo-600">{ligne.quantite_caisses} caisses × {ligne.pcb} {ligne.unite} × {ligne.prix_unitaire.toFixed(2)} €</span>
                    <span className="font-bold text-indigo-700">{formatEuro(ligne.total)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setLignes(p => [...p, newLigne()])}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-indigo-400 text-gray-400 hover:text-indigo-600 rounded-2xl py-3.5 text-sm font-medium transition-colors mb-6">
          <Plus size={16} /> Ajouter un produit
        </button>

        {total > 0 && (
          <div className="bg-indigo-600 rounded-2xl p-5 mb-4 flex justify-between items-center">
            <span className="text-white font-semibold">Total BC</span>
            <span className="text-white text-2xl font-bold">{formatEuro(total)}</span>
          </div>
        )}

        <button onClick={sauvegarder} disabled={saving || lignes.every(l => !l.nom_produit.trim())}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-2xl transition-colors disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Enregistrer le BC'}
        </button>
      </main>
    </>
  )
}
