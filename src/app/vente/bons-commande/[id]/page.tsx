'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { ArrowLeft, Download, Plus, FileCheck } from 'lucide-react'
import { genererPDFVente } from '@/lib/pdf'
import { formatEuro, formatDate } from '@/lib/utils'

interface BC {
  id: string; numero: string; date: string; client_nom: string
  lignes: { nom_produit: string; quantite_caisses: number; pcb: number; unite: string; prix_unitaire: number; total: number }[]
  total_bc: number; bl_id: string | null; statut: string
}
interface BL { id: string; numero: string; date: string; total_bl: number }

export default function BCVenteDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [bc, setBc] = useState<BC | null>(null)
  const [bl, setBl] = useState<BL | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const { data: bcData } = await supabase.from('bons_commande_vente').select('*').eq('id', id).single()
      if (bcData) {
        setBc(bcData)
        if (bcData.bl_id) {
          const { data: blData } = await supabase.from('bons_livraison_vente').select('*').eq('id', bcData.bl_id).single()
          setBl(blData)
        }
      }
      setLoading(false)
    })
  }, [id, router])

  if (loading || !bc) return <><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Chargement...</p></div></>

  const diff = bl ? bl.total_bl - bc.total_bc : null

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">BC {bc.numero}</h1>
            <p className="text-gray-500 text-sm">{formatDate(bc.date)} — {bc.client_nom}</p>
          </div>
          <button onClick={() => genererPDFVente(bc as Parameters<typeof genererPDFVente>[0])}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Download size={15} /> PDF
          </button>
        </div>

        {/* Comparaison BC/BL */}
        {bl && (
          <div className={`rounded-2xl p-5 mb-4 border ${diff && diff < 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className="text-sm font-semibold mb-2 text-gray-700">Comparaison BC / BL</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-500">Commandé (BC)</p>
                <p className="font-bold text-gray-900">{formatEuro(bc.total_bc)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Livré (BL)</p>
                <p className="font-bold text-gray-900">{formatEuro(bl.total_bl)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Écart</p>
                <p className={`font-bold ${diff && diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {diff !== null && (diff >= 0 ? '+' : '')}{formatEuro(diff || 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lignes BC */}
        <div className="bg-white rounded-2xl border border-gray-200 mb-4 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Produits commandés</p>
          </div>
          {bc.lignes.map((l, i) => (
            <div key={i} className="px-5 py-4 border-b border-gray-50 last:border-0 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{l.nom_produit}</p>
                <p className="text-sm text-gray-500">{l.quantite_caisses} caisses × {l.pcb} {l.unite} × {l.prix_unitaire.toFixed(2)} €</p>
              </div>
              <p className="font-semibold text-gray-900">{formatEuro(l.total)}</p>
            </div>
          ))}
          <div className="px-5 py-4 bg-indigo-50 flex justify-between items-center">
            <p className="font-semibold text-indigo-700">Total BC</p>
            <p className="text-xl font-bold text-indigo-700">{formatEuro(bc.total_bc)}</p>
          </div>
        </div>

        {/* BL associé */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Bon de Livraison</p>
          {bl ? (
            <Link href={`/vente/bons-livraison/${bl.id}`}
              className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-3 hover:bg-emerald-100 transition-colors">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-700">BL {bl.numero}</p>
                  <p className="text-xs text-emerald-600">{formatDate(bl.date)}</p>
                </div>
              </div>
              <p className="font-bold text-emerald-700">{formatEuro(bl.total_bl)}</p>
            </Link>
          ) : (
            <div>
              <p className="text-sm text-gray-400 mb-3">Aucun BL associé à ce BC.</p>
              <Link href={`/vente/bons-livraison/nouveau?bc_id=${bc.id}&bc_numero=${bc.numero}`}
                className="flex items-center gap-2 border-2 border-dashed border-gray-300 hover:border-emerald-400 rounded-xl py-3 justify-center text-sm font-medium text-gray-400 hover:text-emerald-600 transition-colors">
                <Plus size={16} /> Créer le BL associé
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
