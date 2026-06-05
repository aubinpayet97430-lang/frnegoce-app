'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Plus, FileText } from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'

interface BL { id: string; numero: string; date: string; bc_numero: string; client_nom: string; total_bl: number }

export default function BonsLivraisonVentePage() {
  const router = useRouter()
  const [bls, setBls] = useState<BL[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const { data: d } = await supabase.from('bons_livraison_vente').select('*').order('date', { ascending: false })
      setBls(d || [])
      setLoading(false)
    })
  }, [router])

  if (loading) return <><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Chargement...</p></div></>

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bons de Livraison</h1>
            <p className="text-gray-500 text-sm mt-0.5">Vente — Vindemia Logistique</p>
          </div>
          <Link href="/vente/bons-livraison/nouveau"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={16} /> Nouveau BL
          </Link>
        </div>

        <div className="flex gap-4 mb-4 border-b border-gray-200">
          <Link href="/vente/bons-commande" className="pb-2 text-sm font-medium text-gray-500 hover:text-gray-700">BC</Link>
          <Link href="/vente/bons-livraison" className="pb-2 text-sm font-semibold text-emerald-600 border-b-2 border-emerald-600">BL</Link>
        </div>

        {bls.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">Aucun bon de livraison</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bls.map(bl => (
              <Link key={bl.id} href={`/vente/bons-livraison/${bl.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-emerald-300 hover:shadow-sm transition-all">
                <div>
                  <p className="font-semibold text-gray-900">BL {bl.numero}</p>
                  <p className="text-sm text-gray-500">{formatDate(bl.date)} — BC {bl.bc_numero}</p>
                </div>
                <p className="font-bold text-gray-900">{formatEuro(bl.total_bl)}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
