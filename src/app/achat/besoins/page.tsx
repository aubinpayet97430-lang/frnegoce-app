'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Plus, ShoppingBag, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface LigneBesoin {
  nom_produit: string
  quantite: number
  unite: string
  commentaire?: string
}

interface BesoinClient {
  id: string
  date: string
  client: string
  lignes: LigneBesoin[]
  created_at: string
}

export default function BesoinsPage() {
  const router = useRouter()
  const [besoins, setBesoins] = useState<BesoinClient[]>([])
  const [loading, setLoading] = useState(true)
  const [ouvert, setOuvert] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      load()
    })
  }, [router])

  async function load() {
    const { data } = await supabase.from('besoins_clients').select('*').order('date', { ascending: false })
    setBesoins(data || [])
    setLoading(false)
  }

  async function supprimer(id: string) {
    if (!confirm('Supprimer ce besoin ?')) return
    await supabase.from('besoins_clients').delete().eq('id', id)
    load()
  }

  if (loading) return <><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Chargement...</p></div></>

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Besoins Clients</h1>
            <p className="text-gray-500 text-sm mt-0.5">Commandes reçues — Leclerc & autres</p>
          </div>
          <Link href="/achat/besoins/nouveau"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={16} /> Nouveau besoin
          </Link>
        </div>

        {besoins.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">Aucun besoin enregistré</p>
            <p className="text-sm mt-1">Saisissez les commandes de vos clients</p>
          </div>
        ) : (
          <div className="space-y-3">
            {besoins.map(b => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOuvert(ouvert === b.id ? null : b.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                      <ShoppingBag size={16} className="text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{b.client}</p>
                      <p className="text-sm text-gray-500">{formatDate(b.date)} — {b.lignes.length} produit{b.lignes.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); supprimer(b.id) }}
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                    {ouvert === b.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {ouvert === b.id && (
                  <div className="border-t border-gray-100">
                    {b.lignes.map((l, i) => (
                      <div key={i} className="px-5 py-3 flex items-center justify-between border-b border-gray-50 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{l.nom_produit}</p>
                          {l.commentaire && <p className="text-xs text-gray-400 mt-0.5">{l.commentaire}</p>}
                        </div>
                        <span className="bg-amber-100 text-amber-700 font-semibold text-sm px-3 py-1 rounded-lg">
                          {l.quantite} {l.unite}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
