'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { StatCard } from '@/components/ui/Card'
import { formatEuro } from '@/lib/utils'
import { TrendingUp, Package, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  ca_vente_semaine: number
  ca_vente_mois: number
  ca_achat_semaine: number
  marge_semaine: number
  bc_sans_bl: number
  bl_semaine: number
  derniers_bc: { id: string; numero: string; date: string; client_nom: string; total_bc: number; bl_id: string | null }[]
}

function debutSemaine() {
  const d = new Date()
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function debutMois() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }

      const semaine = debutSemaine()
      const mois = debutMois()

      const [bls, bcsAll, achats] = await Promise.all([
        supabase.from('bons_livraison_vente').select('*').gte('date', semaine.slice(0, 10)),
        supabase.from('bons_commande_vente').select('*').order('date', { ascending: false }).limit(5),
        supabase.from('bons_commande_achat').select('*').gte('date', semaine.slice(0, 10)),
      ])

      const blsData = bls.data || []
      const bcsData = bcsAll.data || []
      const achatsData = achats.data || []

      const blsMois = await supabase.from('bons_livraison_vente').select('total_bl').gte('date', mois.slice(0, 10))

      const ca_vente_semaine = blsData.reduce((s: number, b: { total_bl: number }) => s + b.total_bl, 0)
      const ca_vente_mois = (blsMois.data || []).reduce((s: number, b: { total_bl: number }) => s + b.total_bl, 0)
      const ca_achat_semaine = achatsData.reduce((s: number, a: { total_achat: number }) => s + a.total_achat, 0)
      const total_vente_achat = achatsData.reduce((s: number, a: { total_vente: number }) => s + a.total_vente, 0)
      const marge_semaine = total_vente_achat > 0 ? ((total_vente_achat - ca_achat_semaine) / total_vente_achat) * 100 : 0
      const bc_sans_bl = bcsData.filter((bc: { bl_id: string | null }) => !bc.bl_id).length

      setStats({
        ca_vente_semaine,
        ca_vente_mois,
        ca_achat_semaine,
        marge_semaine,
        bc_sans_bl,
        bl_semaine: blsData.length,
        derniers_bc: bcsData.slice(0, 5),
      })
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Chargement...</div>
      </div>
    </>
  )

  const s = stats!
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 capitalize">{today}</h1>
          <p className="text-gray-500 mt-1">Bonjour ! Voici votre tableau de bord.</p>
        </div>

        {/* Alertes */}
        {s.bc_sans_bl > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              {s.bc_sans_bl} bon{s.bc_sans_bl > 1 ? 's' : ''} de commande sans BL associé
            </p>
            <Link href="/vente/bons-commande" className="ml-auto text-xs text-amber-700 underline font-medium">Voir</Link>
          </div>
        )}

        {/* Stats vente */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <TrendingUp size={14} /> Vente
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="CA vente cette semaine" value={formatEuro(s.ca_vente_semaine)} sub={`${s.bl_semaine} BL`} color="indigo" />
            <StatCard label="CA vente ce mois" value={formatEuro(s.ca_vente_mois)} color="indigo" />
            <StatCard label="BC en attente de BL" value={`${s.bc_sans_bl}`} sub="bons sans livraison" color={s.bc_sans_bl > 0 ? 'amber' : 'emerald'} />
          </div>
        </div>

        {/* Stats achat */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Package size={14} /> Achat (hors adhérents)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="CA achat cette semaine" value={formatEuro(s.ca_achat_semaine)} color="amber" />
            <StatCard label="Marge brute semaine" value={`${s.marge_semaine.toFixed(1)} %`} color={s.marge_semaine > 0 ? 'emerald' : 'rose'} />
          </div>
        </div>

        {/* Derniers BC */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Derniers bons de commande</h2>
            <Link href="/vente/bons-commande" className="text-xs text-indigo-600 font-medium hover:underline">Tout voir</Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {s.derniers_bc.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Aucun bon de commande</p>
            ) : s.derniers_bc.map((bc, i) => (
              <Link key={bc.id} href={`/vente/bons-commande/${bc.id}`}
                className={`flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors ${i < s.derniers_bc.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-center gap-3">
                  {bc.bl_id
                    ? <CheckCircle size={16} className="text-emerald-500" />
                    : <AlertCircle size={16} className="text-amber-400" />
                  }
                  <div>
                    <p className="font-medium text-gray-900 text-sm">BC {bc.numero}</p>
                    <p className="text-xs text-gray-500">{new Date(bc.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{formatEuro(bc.total_bc)}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
