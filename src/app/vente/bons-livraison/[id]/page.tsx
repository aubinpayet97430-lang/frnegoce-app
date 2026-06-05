'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import { genererPDFBL } from '@/lib/pdf'
import { formatEuro, formatDate } from '@/lib/utils'

interface BL {
  id: string; numero: string; date: string; bc_id: string; bc_numero: string; client_nom: string
  lignes: { nom_produit: string; quantite_caisses: number; pcb: number; unite: string; prix_unitaire: number; total: number }[]
  total_bl: number
}

export default function BLVenteDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [bl, setBl] = useState<BL | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const { data: d } = await supabase.from('bons_livraison_vente').select('*').eq('id', id).single()
      setBl(d)
      setLoading(false)
    })
  }, [id, router])

  if (loading || !bl) return <><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Chargement...</p></div></>

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">BL {bl.numero}</h1>
            <p className="text-gray-500 text-sm">{formatDate(bl.date)} — {bl.client_nom}</p>
          </div>
          <button onClick={() => genererPDFBL(bl as Parameters<typeof genererPDFBL>[0])}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Download size={15} /> PDF
          </button>
        </div>

        {bl.bc_id && (
          <Link href={`/vente/bons-commande/${bl.bc_id}`}
            className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-4 hover:bg-indigo-100 transition-colors">
            <FileText size={16} className="text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">Lié au BC {bl.bc_numero}</span>
          </Link>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 mb-4 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Produits livrés</p>
          </div>
          {bl.lignes.map((l, i) => (
            <div key={i} className="px-5 py-4 border-b border-gray-50 last:border-0 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{l.nom_produit}</p>
                <p className="text-sm text-gray-500">{l.quantite_caisses} caisses × {l.pcb} {l.unite} × {l.prix_unitaire.toFixed(2)} €</p>
              </div>
              <p className="font-semibold text-gray-900">{formatEuro(l.total)}</p>
            </div>
          ))}
          <div className="px-5 py-4 bg-emerald-50 flex justify-between items-center">
            <p className="font-semibold text-emerald-700">Total BL</p>
            <p className="text-xl font-bold text-emerald-700">{formatEuro(bl.total_bl)}</p>
          </div>
        </div>
      </main>
    </>
  )
}
