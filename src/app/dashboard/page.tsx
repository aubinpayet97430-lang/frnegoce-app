'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { StatCard } from '@/components/ui/Card'
import { formatEuro } from '@/lib/utils'
import { TrendingUp, Package, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
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

function getNumSemaine(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function getDatesFromSemaine(semaine: number, annee: number): { debut: string; fin: string; debutMois: string } {
  const jan1 = new Date(annee, 0, 1)
  const daysOffset = (semaine - 1) * 7
  const debut = new Date(jan1.getTime() + daysOffset * 86400000)
  const jourSemaine = debut.getDay() || 7
  debut.setDate(debut.getDate() - jourSemaine + 1)
  const fin = new Date(debut)
  fin.setDate(fin.getDate() + 6)
  const debutMois = new Date(debut.getFullYear(), debut.getMonth(), 1)
  return {
    debut: debut.toISOString().slice(0, 10),
    fin: fin.toISOString().slice(0, 10),
    debutMois: debutMois.toISOString().slice(0, 10),
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const now = new Date()
  const [semaine, setSemaine] = useState(getNumSemaine(now))
  const [annee, setAnnee] = useState(now.getFullYear())
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const chargerStats = useCallback(async (sem: number, an: number) => {
    setLoading(true)
    const supabase = createClient()
    const { debut, fin, debutMois } = getDatesFromSemaine(sem, an)

    const [bls, bcsAll, achats, blsMois] = await Promise.all([
      supabase.from('bons_livraison_vente').select('*').gte('date', debut).lte('date', fin),
      supabase.from('bons_commande_vente').select('*').order('date', { ascending: false }).limit(5),
      supabase.from('bons_commande_achat').select('*').gte('date', debut).lte('date', fin),
      supabase.from('bons_livraison_vente').select('total_bl').gte('date', debutMois).lte('date', fin),
    ])

    const blsData = bls.data || []
    const bcsData = bcsAll.data || []
    const achatsData = achats.data || []

    const ca_vente_semaine = blsData.reduce((s: number, b: { total_bl: number }) => s + b.total_bl, 0)
    const ca_vente_mois = (blsMois.data || []).reduce((s: number, b: { total_bl: number }) => s + b.total_bl, 0)
    const ca_achat_semaine = achatsData.reduce((s: number, a: { total_achat: number }) => s + a.total_achat, 0)
    const total_vente_achat = achatsData.reduce((s: number, a: { total_vente: number }) => s + a.total_vente, 0)
    const marge_semaine = total_vente_achat > 0 ? ((total_vente_achat - ca_achat_semaine) / total_vente_achat) * 100 : 0
    const bc_sans_bl = bcsData.filter((bc: { bl_id: string | null }) => !bc.bl_id).length

    setStats({
      ca_vente_semaine, ca_vente_mois, ca_achat_semaine, marge_semaine,
      bc_sans_bl, bl_semaine: blsData.length, derniers_bc: bcsData.slice(0, 5),
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/login'); return }
      chargerStats(semaine, annee)
    })
  }, [router, chargerStats, semaine, annee])

  function semainePrecedente() {
    if (semaine === 1) { setSemaine(52); setAnnee(a => a - 1) }
    else setSemaine(s => s - 1)
  }

  function semaineSuivante() {
    const semaineActuelle = getNumSemaine(now)
    if (semaine === semaineActuelle && annee === now.getFullYear()) return
    if (semaine === 52) { setSemaine(1); setAnnee(a => a + 1) }
    else setSemaine(s => s + 1)
  }

  function resetAujourdhui() {
    setSemaine(getNumSemaine(now))
    setAnnee(now.getFullYear())
  }

  const estSemaineActuelle = semaine === getNumSemaine(now) && annee === now.getFullYear()
  const { debut, fin } = getDatesFromSemaine(semaine, annee)
  const labelPeriode = `${new Date(debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${new Date(fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Header + sélecteur de semaine */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-gray-500 mt-1 text-sm">{labelPeriode}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={semainePrecedente}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl">
              <span className="text-sm font-semibold text-gray-900">S{semaine}</span>
              <span className="text-sm text-gray-400">{annee}</span>
            </div>
            <button onClick={semaineSuivante} disabled={estSemaineActuelle}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight size={18} />
            </button>
            {!estSemaineActuelle && (
              <button onClick={resetAujourdhui}
                className="px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl border border-indigo-200 transition-colors">
                Aujourd'hui
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Chargement...</div>
        ) : stats && (
          <>
            {/* Alertes */}
            {stats.bc_sans_bl > 0 && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
                <AlertCircle size={18} className="text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800 font-medium">
                  {stats.bc_sans_bl} bon{stats.bc_sans_bl > 1 ? 's' : ''} de commande sans BL associé
                </p>
                <Link href="/vente/bons-commande" className="ml-auto text-xs text-amber-700 underline font-medium">Voir</Link>
              </div>
            )}

            {/* Stats vente */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <TrendingUp size={14} /> Vente — S{semaine}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard label="CA vente semaine" value={formatEuro(stats.ca_vente_semaine)} sub={`${stats.bl_semaine} BL`} color="indigo" />
                <StatCard label="CA vente mois" value={formatEuro(stats.ca_vente_mois)} color="indigo" />
                <StatCard label="BC en attente de BL" value={`${stats.bc_sans_bl}`} sub="bons sans livraison" color={stats.bc_sans_bl > 0 ? 'amber' : 'emerald'} />
              </div>
            </div>

            {/* Stats achat */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Package size={14} /> Achat (hors adhérents) — S{semaine}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="CA achat semaine" value={formatEuro(stats.ca_achat_semaine)} color="amber" />
                <StatCard label="Marge brute semaine" value={`${stats.marge_semaine.toFixed(1)} %`} color={stats.marge_semaine > 0 ? 'emerald' : 'rose'} />
              </div>
            </div>

            {/* Derniers BC */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Derniers bons de commande</h2>
                <Link href="/vente/bons-commande" className="text-xs text-indigo-600 font-medium hover:underline">Tout voir</Link>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {stats.derniers_bc.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Aucun bon de commande</p>
                ) : stats.derniers_bc.map((bc, i) => (
                  <Link key={bc.id} href={`/vente/bons-commande/${bc.id}`}
                    className={`flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors ${i < stats.derniers_bc.length - 1 ? 'border-b border-gray-100' : ''}`}>
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
          </>
        )}
      </main>
    </>
  )
}
