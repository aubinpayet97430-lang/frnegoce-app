'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import { Unite } from '@/types'

interface Ligne { id: string; nom_produit: string; quantite_caisses: number; pcb: number; unite: Unite; prix_unitaire: number; total: number }

export default function ModifierBLVentePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [date, setDate] = useState('')
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const { data: bl } = await supabase.from('bons_livraison_vente').select('*').eq('id', id).single()
      if (bl) {
        setDate(bl.date)
        setLignes(bl.lignes.map((l: Omit<Ligne, 'id'>) => ({ ...l, id: crypto.randomUUID() })))
      }
      setLoading(false)
    })
  }, [id, router])

  function updateLigne(lid: string, field: string, value: string | number) {
    setLignes(prev => prev.map(l => {
      if (l.id !== lid) return l
      const updated = { ...l, [field]: value, pcb: 1 }
      updated.total = updated.quantite_caisses * updated.prix_unitaire
      return updated
    }))
  }

  const total = lignes.reduce((s, l) => s + l.total, 0)

  async function sauvegarder() {
    const valides = lignes.filter(l => l.nom_produit.trim() && l.quantite_caisses > 0)
    if (valides.length === 0) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('bons_livraison_vente').update({
      date,
      lignes: valides.map(({ id: _, ...l }) => l),
      total_bl: total
    }).eq('id', id)
    if (!error) router.push(`/vente/bons-livraison/${id}`)
    else { alert('Erreur : ' + error.message); setSaving(false) }
  }

  if (loading) return <><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Chargement...</p></div></>

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Modifier le BL</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
                <input type="text" placeholder="Nom du produit" value={ligne.nom_produit}
                  onChange={e => updateLigne(ligne.id, 'nom_produit', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Poids (kg)</label>
                    <input type="number" min="0" step="0.1" value={ligne.quantite_caisses || ''}
                      onChange={e => updateLigne(ligne.id, 'quantite_caisses', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Prix / kg</label>
                    <input type="number" step="0.01" min="0" value={ligne.prix_unitaire || ''}
                      onChange={e => updateLigne(ligne.id, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                {ligne.total > 0 && (
                  <div className="bg-emerald-50 rounded-xl px-4 py-2.5 flex justify-between">
                    <span className="text-xs text-emerald-600">{ligne.quantite_caisses} kg × {ligne.prix_unitaire.toFixed(2)} €/kg</span>
                    <span className="font-bold text-emerald-700">{formatEuro(ligne.total)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setLignes(p => [...p, { id: crypto.randomUUID(), nom_produit: '', quantite_caisses: 0, pcb: 1, unite: 'caisse', prix_unitaire: 0, total: 0 }])}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-emerald-400 text-gray-400 hover:text-emerald-600 rounded-2xl py-3.5 text-sm font-medium transition-colors mb-6">
          <Plus size={16} /> Ajouter un produit
        </button>

        {total > 0 && (
          <div className="bg-emerald-600 rounded-2xl p-5 mb-4 flex justify-between items-center">
            <span className="text-white font-semibold">Total BL HT</span>
            <span className="text-white text-2xl font-bold">{formatEuro(total)}</span>
          </div>
        )}

        <button onClick={sauvegarder} disabled={saving}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-2xl transition-colors disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </main>
    </>
  )
}
