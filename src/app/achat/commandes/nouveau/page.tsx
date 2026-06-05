'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { genNumero, formatEuro, calcMarge } from '@/lib/utils'
import { Unite } from '@/types'

interface Ligne { id: string; nom_produit: string; quantite_caisses: number; pcb: number; unite: Unite; prix_achat: number; prix_vente: number; marge: number; total_achat: number; total_vente: number }

function newLigne(): Ligne {
  return { id: crypto.randomUUID(), nom_produit: '', quantite_caisses: 0, pcb: 1, unite: 'kg', prix_achat: 0, prix_vente: 0, marge: 0, total_achat: 0, total_vente: 0 }
}

export default function NouvelleCommandeAchatPage() {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [fournisseur, setFournisseur] = useState('')
  const [lignes, setLignes] = useState<Ligne[]>([newLigne()])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
    })
  }, [router])

  function updateLigne(id: string, field: string, value: string | number) {
    setLignes(prev => prev.map(l => {
      if (l.id !== id) return l
      const updated = { ...l, [field]: value }
      updated.total_achat = updated.quantite_caisses * updated.pcb * updated.prix_achat
      updated.total_vente = updated.quantite_caisses * updated.pcb * updated.prix_vente
      updated.marge = calcMarge(updated.prix_achat, updated.prix_vente)
      return updated
    }))
  }

  const totaux = lignes.reduce((s, l) => ({
    achat: s.achat + l.total_achat,
    vente: s.vente + l.total_vente,
  }), { achat: 0, vente: 0 })
  const margeGlobale = calcMarge(totaux.achat, totaux.vente)

  async function sauvegarder() {
    const valides = lignes.filter(l => l.nom_produit.trim() && l.quantite_caisses > 0)
    if (valides.length === 0 || !fournisseur.trim()) return
    setSaving(true)
    const supabase = createClient()
    const numero = genNumero('BCA')
    const { data, error } = await supabase.from('bons_commande_achat').insert({
      numero, date, fournisseur,
      lignes: valides.map(({ id: _, ...l }) => l),
      total_achat: totaux.achat,
      total_vente: totaux.vente,
      marge_totale: margeGlobale,
    }).select().single()
    if (!error && data) router.push(`/achat/commandes/${data.id}`)
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
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle commande achat</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fournisseur</label>
            <input type="text" placeholder="Nom du producteur / OP" value={fournisseur} onChange={e => setFournisseur(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
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
                <input type="text" placeholder="Nom du produit" value={ligne.nom_produit}
                  onChange={e => updateLigne(ligne.id, 'nom_produit', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nb caisses</label>
                    <input type="number" min="0" value={ligne.quantite_caisses || ''}
                      onChange={e => updateLigne(ligne.id, 'quantite_caisses', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">PCB</label>
                    <input type="number" min="1" value={ligne.pcb || ''}
                      onChange={e => updateLigne(ligne.id, 'pcb', parseFloat(e.target.value) || 1)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Unité</label>
                    <select value={ligne.unite} onChange={e => updateLigne(ligne.id, 'unite', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="kg">kg</option>
                      <option value="unite">unité</option>
                      <option value="caisse">caisse</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Prix achat / {ligne.unite}</label>
                    <input type="number" step="0.01" min="0" value={ligne.prix_achat || ''}
                      onChange={e => updateLigne(ligne.id, 'prix_achat', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Prix vente / {ligne.unite}</label>
                    <input type="number" step="0.01" min="0" value={ligne.prix_vente || ''}
                      onChange={e => updateLigne(ligne.id, 'prix_vente', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>

                {(ligne.total_achat > 0 || ligne.total_vente > 0) && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-red-50 rounded-xl px-3 py-2 text-center">
                      <p className="text-xs text-red-500">Achat</p>
                      <p className="font-bold text-red-700 text-sm">{formatEuro(ligne.total_achat)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl px-3 py-2 text-center">
                      <p className="text-xs text-emerald-500">Vente</p>
                      <p className="font-bold text-emerald-700 text-sm">{formatEuro(ligne.total_vente)}</p>
                    </div>
                    <div className={`rounded-xl px-3 py-2 text-center ${ligne.marge > 0 ? 'bg-indigo-50' : 'bg-rose-50'}`}>
                      <p className="text-xs text-gray-500">Marge</p>
                      <p className={`font-bold text-sm ${ligne.marge > 0 ? 'text-indigo-700' : 'text-rose-700'}`}>{ligne.marge.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setLignes(p => [...p, newLigne()])}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-amber-400 text-gray-400 hover:text-amber-600 rounded-2xl py-3.5 text-sm font-medium transition-colors mb-6">
          <Plus size={16} /> Ajouter un produit
        </button>

        {totaux.achat > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Récapitulatif</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-xs text-red-500 mb-1">Total achat</p>
                <p className="font-bold text-red-700">{formatEuro(totaux.achat)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs text-emerald-500 mb-1">Total vente</p>
                <p className="font-bold text-emerald-700">{formatEuro(totaux.vente)}</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-xs text-indigo-500 mb-1">Marge globale</p>
                <p className="font-bold text-indigo-700">{margeGlobale.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        <button onClick={sauvegarder} disabled={saving || !fournisseur.trim() || lignes.every(l => !l.nom_produit.trim())}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 rounded-2xl transition-colors disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Enregistrer la commande'}
        </button>
      </main>
    </>
  )
}
