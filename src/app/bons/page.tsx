'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { FileText, Eye, Paperclip } from 'lucide-react'

interface BL {
  id: string
  date: string
  photo_url: string
  bc_id: string | null
}

interface BC {
  id: string
  numero: string
  date: string
  bl_id: string | null
}

export default function BonsPage() {
  const router = useRouter()
  const [bcs, setBcs] = useState<BC[]>([])
  const [bls, setBls] = useState<BL[]>([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState<'bc' | 'bl'>('bc')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const [{ data: bcData }, { data: blData }] = await Promise.all([
        supabase.from('bons_commande').select('*').order('date', { ascending: false }),
        supabase.from('bons_livraison').select('*').order('date', { ascending: false }),
      ])
      setBcs(bcData || [])
      setBls(blData || [])
      setLoading(false)
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
        <h1 className="text-xl font-bold text-gray-900 mb-6">Archives</h1>

        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setOnglet('bc')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${onglet === 'bc' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Bons de Commande ({bcs.length})
          </button>
          <button
            onClick={() => setOnglet('bl')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${onglet === 'bl' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Bons de Livraison ({bls.length})
          </button>
        </div>

        {onglet === 'bc' && (
          <div className="space-y-3">
            {bcs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText size={36} className="mx-auto mb-3 opacity-40" />
                <p>Aucun bon de commande</p>
              </div>
            ) : bcs.map((bc) => (
              <Link
                key={bc.id}
                href={`/commandes/${bc.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-green-300 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">BC {bc.numero}</span>
                    {bc.bl_id && (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        <Paperclip size={9} /> BL lié
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{new Date(bc.date).toLocaleDateString('fr-FR')}</p>
                </div>
                <Eye size={16} className="text-gray-300" />
              </Link>
            ))}
          </div>
        )}

        {onglet === 'bl' && (
          <div className="space-y-3">
            {bls.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Paperclip size={36} className="mx-auto mb-3 opacity-40" />
                <p>Aucun bon de livraison</p>
              </div>
            ) : bls.map((bl) => {
              const bcLie = bcs.find((bc) => bc.id === bl.bc_id)
              return (
                <div key={bl.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">BL du {new Date(bl.date).toLocaleDateString('fr-FR')}</p>
                      {bcLie && (
                        <p className="text-sm text-green-700 mt-0.5">Lié au BC {bcLie.numero}</p>
                      )}
                    </div>
                    <a href={bl.photo_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                      <Eye size={18} />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
