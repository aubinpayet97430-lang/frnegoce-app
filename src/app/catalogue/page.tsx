'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Plus, Pencil, Trash2, BookOpen, Check, X } from 'lucide-react'
import { Unite } from '@/types'

interface Produit { id: string; nom: string; pcb: number; unite: Unite; categorie: string }

export default function CataloguePage() {
  const router = useRouter()
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Partial<Produit> | null>(null)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      load()
    })
  }, [router])

  async function load() {
    const { data } = await supabase.from('produits').select('*').order('nom')
    setProduits(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form?.nom?.trim()) return
    setSaving(true)
    if (form.id) {
      await supabase.from('produits').update({ nom: form.nom, pcb: form.pcb, unite: form.unite, categorie: form.categorie }).eq('id', form.id)
    } else {
      await supabase.from('produits').insert({ nom: form.nom, pcb: form.pcb || 1, unite: form.unite || 'kg', categorie: form.categorie || '' })
    }
    setForm(null)
    setSaving(false)
    load()
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer ce produit ?')) return
    await supabase.from('produits').delete().eq('id', id)
    load()
  }

  if (loading) return <><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Chargement...</p></div></>

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Catalogue Produits</h1>
            <p className="text-gray-500 text-sm mt-0.5">{produits.length} produit{produits.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setForm({ nom: '', pcb: 1, unite: 'kg', categorie: '' })}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={16} /> Ajouter
          </button>
        </div>

        {/* Formulaire */}
        {form !== null && (
          <div className="bg-white rounded-2xl border-2 border-indigo-300 p-5 mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">{form.id ? 'Modifier le produit' : 'Nouveau produit'}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Nom du produit *</label>
                <input type="text" placeholder="Ex: Tomates rondes" value={form.nom || ''}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">PCB</label>
                <input type="number" min="1" value={form.pcb || ''}
                  onChange={e => setForm(f => ({ ...f, pcb: parseInt(e.target.value) || 1 }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Unité</label>
                <select value={form.unite || 'kg'} onChange={e => setForm(f => ({ ...f, unite: e.target.value as Unite }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="kg">kg</option>
                  <option value="unite">unité</option>
                  <option value="caisse">caisse</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Catégorie</label>
                <input type="text" placeholder="Ex: Légumes, Fruits..." value={form.categorie || ''}
                  onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                <Check size={15} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button onClick={() => setForm(null)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm px-4 py-2 rounded-xl border border-gray-300">
                <X size={15} /> Annuler
              </button>
            </div>
          </div>
        )}

        {produits.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">Catalogue vide</p>
            <p className="text-sm mt-1">Ajoutez vos premiers produits</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-4 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span className="col-span-2">Produit</span>
              <span>PCB / Unité</span>
              <span>Catégorie</span>
            </div>
            {produits.map((p, i) => (
              <div key={p.id} className={`grid grid-cols-4 gap-3 px-5 py-3.5 items-center ${i < produits.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <span className="col-span-2 font-medium text-gray-900">{p.nom}</span>
                <span className="text-sm text-gray-500">{p.pcb} {p.unite}</span>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{p.categorie || '—'}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setForm(p)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => supprimer(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
