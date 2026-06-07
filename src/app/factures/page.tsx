'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Plus, FileText, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'

interface Facture {
  id: string
  numero: string
  semaine: string
  date: string
  ca_eligible: number
  montant_commission: number
  statut: 'en_attente' | 'validee' | 'rejetee'
  pdf_url?: string
  commentaire?: string
  created_at: string
}

export default function FacturesPage() {
  const router = useRouter()
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState<'en_attente' | 'validee'>('en_attente')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const { data: d } = await supabase.from('factures_commission').select('*').order('date', { ascending: false })
      setFactures(d || [])
      setLoading(false)
    })
  }, [router])

  const enAttente = factures.filter(f => f.statut === 'en_attente')
  const traitees = factures.filter(f => f.statut !== 'en_attente')

  if (loading) return <><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Chargement...</p></div></>

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Factures de commission</h1>
            <p className="text-gray-500 text-sm mt-0.5">4% du CA HT livré éligible</p>
          </div>
          <Link href="/factures/nouvelle"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={16} /> Nouvelle facture
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button onClick={() => setOnglet('en_attente')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${onglet === 'en_attente' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            <Clock size={14} /> En attente ({enAttente.length})
          </button>
          <button onClick={() => setOnglet('validee')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${onglet === 'validee' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            <CheckCircle size={14} /> Traitées ({traitees.length})
          </button>
        </div>

        {/* Liste */}
        {(onglet === 'en_attente' ? enAttente : traitees).length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">Aucune facture</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(onglet === 'en_attente' ? enAttente : traitees).map(f => (
              <Link key={f.id} href={`/factures/${f.id}`}
                className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-5 py-4 hover:border-indigo-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    f.statut === 'validee' ? 'bg-emerald-100' : f.statut === 'rejetee' ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    {f.statut === 'validee' ? <CheckCircle size={16} className="text-emerald-600" /> :
                     f.statut === 'rejetee' ? <XCircle size={16} className="text-red-600" /> :
                     <Clock size={16} className="text-amber-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{f.numero}</p>
                    <p className="text-sm text-gray-500">Semaine {f.semaine} — {formatDate(f.date)}</p>
                    {f.commentaire && <p className="text-xs text-red-500 mt-0.5">{f.commentaire}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatEuro(f.montant_commission)}</p>
                    <p className="text-xs text-gray-400">CA éligible : {formatEuro(f.ca_eligible)}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
