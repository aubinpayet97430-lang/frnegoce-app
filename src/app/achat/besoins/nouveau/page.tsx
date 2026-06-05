'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'

interface Ligne { id: string; nom_produit: string; quantite: number; unite: string; commentaire: string }

function newLigne(): Ligne {
  return { id: crypto.randomUUID(), nom_produit: '', quantite: 0, unite: 'caisse', commentaire: '' }
}

export default function NouveauBesoinPage() {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [date_livraison, setDateLivraison] = useState('')
  const [client, setClient] = useState('Leclerc')
  const [lignes, setLignes] = useState<Ligne[]>([newLigne()])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
    })
  }, [router])

  function updateLigne(id: string, field: string, value: string | number) {
    setLignes(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  async function sauvegarder() {
    const valides = lignes.filter(l => l.nom_produit.trim() && l.quantite > 0)
    if (valides.length === 0 || !client.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('besoins_clients').insert({
      date, date_livraison: date_livraison || null, client,
      lignes: valides.map(({ id: _, ...l }) => l)
    })
    if (!error) router.push('/achat/besoins')
    else { alert('Erreur : ' + error.message); setSaving(false) }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau besoin client</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de saisie</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Client</label>
            <input type="text" value={client} onChange={e => setClient(e.target.value)}
              placeholder="Ex: Leclerc, Métro..."
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de livraison souhaitée</label>
            <input type="date" value={date_livraison} onChange={e => setDateLivraison(e.target.value)}
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Quantité</label>
                    <input type="number" min="0" value={ligne.quantite || ''}
                      onChange={e => updateLigne(ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Unité</label>
                    <select value={ligne.unite} onChange={e => updateLigne(ligne.id, 'unite', e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="caisse">caisse(s)</option>
                      <option value="kg">kg</option>
                      <option value="palette">palette(s)</option>
                      <option value="unite">unité(s)</option>
                    </select>
                  </div>
                </div>
                <input type="text" placeholder="Commentaire (optionnel)" value={ligne.commentaire}
                  onChange={e => updateLigne(ligne.id, 'commentaire', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setLignes(p => [...p, newLigne()])}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-amber-400 text-gray-400 hover:text-amber-600 rounded-2xl py-3.5 text-sm font-medium transition-colors mb-6">
          <Plus size={16} /> Ajouter un produit
        </button>

        <button onClick={sauvegarder} disabled={saving || !client.trim() || lignes.every(l => !l.nom_produit.trim())}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 rounded-2xl transition-colors disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </main>
    </>
  )
}
