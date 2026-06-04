'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { LigneProduit, Unite } from '@/types'

function genId() { return Math.random().toString(36).slice(2) }

function nouvelleLigne(): LigneProduit {
  return { id: genId(), nom: '', quantite: 0, prix: 0, unite: 'caisse' }
}

export default function NouvellePage() {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [lignes, setLignes] = useState<LigneProduit[]>([nouvelleLigne()])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
    })
  }, [router])

  function updateLigne(id: string, field: keyof LigneProduit, value: string | number) {
    setLignes((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l))
  }

  function ajouterLigne() { setLignes((prev) => [...prev, nouvelleLigne()]) }
  function supprimerLigne(id: string) { setLignes((prev) => prev.filter((l) => l.id !== id)) }

  async function sauvegarder() {
    const valides = lignes.filter((l) => l.nom.trim())
    if (valides.length === 0) return
    setSaving(true)
    const supabase = createClient()
    const numero = `${date.replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
    const { data, error } = await supabase
      .from('bons_commande')
      .insert({ numero, date, lignes: valides })
      .select()
      .single()
    if (!error && data) router.push(`/commandes/${data.id}`)
    else {
      alert('Erreur : ' + (error?.message || 'inconnue'))
      setSaving(false)
    }
  }

  const total = lignes.reduce((s, l) => s + l.quantite * l.prix, 0)

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Nouvelle commande</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="space-y-3 mb-4">
          {lignes.map((ligne, i) => (
            <div key={ligne.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Produit {i + 1}</span>
                {lignes.length > 1 && (
                  <button onClick={() => supprimerLigne(ligne.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nom du produit (ex: Tomates)"
                  value={ligne.nom}
                  onChange={(e) => updateLigne(ligne.id, 'nom', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Quantité</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={ligne.quantite || ''}
                      onChange={(e) => updateLigne(ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Unité</label>
                    <select
                      value={ligne.unite}
                      onChange={(e) => updateLigne(ligne.id, 'unite', e.target.value as Unite)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="caisse">caisse</option>
                      <option value="kg">kg</option>
                      <option value="unite">unité</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Prix (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={ligne.prix || ''}
                      onChange={(e) => updateLigne(ligne.id, 'prix', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                {ligne.quantite > 0 && ligne.prix > 0 && (
                  <p className="text-xs text-right text-gray-500">
                    = <span className="font-semibold text-gray-700">{(ligne.quantite * ligne.prix).toFixed(2)} €</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={ajouterLigne}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-green-400 text-gray-400 hover:text-green-600 rounded-xl py-3 text-sm font-medium transition-colors mb-6"
        >
          <Plus size={16} />
          Ajouter un produit
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Total commande</span>
            <span className="text-xl font-bold text-gray-900">{total.toFixed(2)} €</span>
          </div>
        </div>

        <button
          onClick={sauvegarder}
          disabled={saving || lignes.every((l) => !l.nom.trim())}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer la commande'}
        </button>
      </main>
    </>
  )
}
