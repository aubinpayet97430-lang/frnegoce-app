'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Plus, FileText, Paperclip } from 'lucide-react'

interface BC {
  id: string
  numero: string
  date: string
  lignes: { nom: string; quantite: number; prix: number; unite: string }[]
  bl_id: string | null
}

export default function CommandesPage() {
  const router = useRouter()
  const [commandes, setCommandes] = useState<BC[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      supabase
        .from('bons_commande')
        .select('*')
        .order('date', { ascending: false })
        .then(({ data }) => {
          setCommandes(data || [])
          setLoading(false)
        })
    })
  }, [router])

  if (loading) return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Chargement...</p>
      </div>
    </>
  )

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Commandes</h1>
            <p className="text-sm text-gray-500">Vindemia Logistique</p>
          </div>
          <Link
            href="/commandes/nouvelle"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Nouvelle
          </Link>
        </div>

        {commandes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Aucune commande</p>
            <p className="text-sm mt-1">Créez votre première commande du matin</p>
          </div>
        ) : (
          <div className="space-y-3">
            {commandes.map((bc) => {
              const total = bc.lignes.reduce((s, l) => s + l.quantite * l.prix, 0)
              return (
                <Link
                  key={bc.id}
                  href={`/commandes/${bc.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-green-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">BC {bc.numero}</span>
                        {bc.bl_id && (
                          <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            <Paperclip size={10} />
                            BL lié
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {new Date(bc.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">{bc.lignes.length} produit{bc.lignes.length > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{total.toFixed(2)} €</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
