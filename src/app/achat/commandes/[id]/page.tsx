'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { ArrowLeft, Download, Pencil, Trash2 } from 'lucide-react'
import { genererPDFAchat } from '@/lib/pdf'
import { formatEuro, formatDate } from '@/lib/utils'

interface BCA {
  id: string; numero: string; date: string; fournisseur: string
  lignes: { nom_produit: string; quantite_caisses: number; pcb: number; unite: string; prix_achat: number; prix_vente: number; marge: number; total_achat: number; total_vente: number }[]
  total_achat: number; total_vente: number; marge_totale: number
}

export default function BCADetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [bc, setBc] = useState<BCA | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const { data: d } = await supabase.from('bons_commande_achat').select('*').eq('id', id).single()
      setBc(d)
      setLoading(false)
    })
  }, [id, router])

  if (loading || !bc) return <><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Chargement...</p></div></>

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">BCA {bc.numero}</h1>
            <p className="text-gray-500 text-sm">{formatDate(bc.date)} — {bc.fournisseur}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/achat/commandes/${id}/modifier`}
              className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-semibold px-3 py-2.5 rounded-xl">
              <Pencil size={15} /> Modifier
            </Link>
            <button onClick={() => genererPDFAchat(bc as Parameters<typeof genererPDFAchat>[0])}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-3 py-2.5 rounded-xl">
              <Download size={15} /> PDF
            </button>
            <button onClick={async () => {
              if (!confirm('Supprimer cette commande achat ?')) return
              const supabase = createClient()
              await supabase.from('bons_commande_achat').delete().eq('id', id)
              router.push('/achat/commandes')
            }} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold px-3 py-2.5 rounded-xl">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Résumé marge */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-red-50 rounded-2xl p-4 text-center">
            <p className="text-xs text-red-500 mb-1">Total achat</p>
            <p className="font-bold text-red-700">{formatEuro(bc.total_achat)}</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 text-center">
            <p className="text-xs text-emerald-500 mb-1">Total vente</p>
            <p className="font-bold text-emerald-700">{formatEuro(bc.total_vente)}</p>
          </div>
          <div className="bg-indigo-50 rounded-2xl p-4 text-center">
            <p className="text-xs text-indigo-500 mb-1">Marge</p>
            <p className="font-bold text-indigo-700">{bc.marge_totale.toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span className="col-span-2">Produit</span>
              <span className="text-right">Achat</span>
              <span className="text-right">Vente</span>
              <span className="text-right">Marge</span>
            </div>
          </div>
          {bc.lignes.map((l, i) => (
            <div key={i} className="px-5 py-4 border-b border-gray-50 last:border-0">
              <div className="grid grid-cols-5 gap-2 items-center">
                <div className="col-span-2">
                  <p className="font-medium text-gray-900 text-sm">{l.nom_produit}</p>
                  <p className="text-xs text-gray-500">{l.quantite_caisses} c. × {l.pcb} {l.unite}</p>
                </div>
                <p className="text-right text-sm font-semibold text-red-600">{formatEuro(l.total_achat)}</p>
                <p className="text-right text-sm font-semibold text-emerald-600">{formatEuro(l.total_vente)}</p>
                <p className={`text-right text-sm font-bold ${l.marge > 0 ? 'text-indigo-600' : 'text-rose-600'}`}>{l.marge.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
