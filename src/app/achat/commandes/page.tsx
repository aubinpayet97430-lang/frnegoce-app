'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Plus, Package } from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'

interface BCA { id: string; numero: string; date: string; fournisseur: string; total_achat: number; total_vente: number; marge_totale: number }

export default function AchatCommandesPage() {
  const router = useRouter()
  const [bcs, setBcs] = useState<BCA[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const { data: d } = await supabase.from('bons_commande_achat').select('*').order('date', { ascending: false })
      setBcs(d || [])
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
            <h1 className="text-2xl font-bold text-gray-900">Commandes Achat</h1>
            <p className="text-gray-500 text-sm mt-0.5">Hors adhérents — producteurs & OP</p>
          </div>
          <Link href="/achat/commandes/nouveau"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={16} /> Nouvelle commande
          </Link>
        </div>

        {bcs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">Aucune commande achat</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bcs.map(bc => (
              <Link key={bc.id} href={`/achat/commandes/${bc.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-amber-300 hover:shadow-sm transition-all">
                <div>
                  <p className="font-semibold text-gray-900">BCA {bc.numero}</p>
                  <p className="text-sm text-gray-500">{formatDate(bc.date)} — {bc.fournisseur}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatEuro(bc.total_achat)}</p>
                  <p className="text-xs font-medium text-emerald-600">Marge {bc.marge_totale.toFixed(1)}%</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
