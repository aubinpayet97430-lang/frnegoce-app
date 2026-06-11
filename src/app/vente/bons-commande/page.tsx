'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Plus, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'

interface BC {
  id: string; numero: string; date: string; client_nom: string; total_bc: number; bl_id: string | null
}

function getNumSemaine(dateStr: string): number {
  const d = new Date(dateStr)
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function getAnnee(dateStr: string): number {
  return new Date(dateStr).getFullYear()
}

export default function BonsCommandeVentePage() {
  const router = useRouter()
  const [bcs, setBcs] = useState<BC[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const { data: d } = await supabase.from('bons_commande_vente').select('*').order('date', { ascending: false })
      setBcs(d || [])
      setLoading(false)
    })
  }, [router])

  // Grouper par semaine
  const parSemaine = new Map<string, BC[]>()
  bcs.forEach(bc => {
    const key = `${getAnnee(bc.date)}-S${getNumSemaine(bc.date)}`
    if (!parSemaine.has(key)) parSemaine.set(key, [])
    parSemaine.get(key)!.push(bc)
  })

  if (loading) return <><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Chargement...</p></div></>

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bons de Commande</h1>
            <p className="text-gray-500 text-sm mt-0.5">Vente — Vindemia Logistique</p>
          </div>
          <Link href="/vente/bons-commande/nouveau"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={16} /> Nouveau BC
          </Link>
        </div>

        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <Link href="/vente/bons-commande" className="pb-2 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600">BC</Link>
          <Link href="/vente/bons-livraison" className="pb-2 text-sm font-medium text-gray-500 hover:text-gray-700">BL</Link>
        </div>

        {bcs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">Aucun bon de commande</p>
            <p className="text-sm mt-1">Créez votre premier BC</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(parSemaine.entries()).map(([semLabel, bcsSemaine]) => {
              const caSemaine = bcsSemaine.reduce((s, bc) => s + bc.total_bc, 0)
              const nbSansBL = bcsSemaine.filter(bc => !bc.bl_id).length
              return (
                <div key={semLabel}>
                  {/* En-tête semaine */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{semLabel}</span>
                      {nbSansBL > 0 && (
                        <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                          {nbSansBL} sans BL
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{formatEuro(caSemaine)}</span>
                      <span className="text-xs text-gray-400 ml-2">CA commandé</span>
                    </div>
                  </div>

                  {/* BC de la semaine */}
                  <div className="space-y-2">
                    {bcsSemaine.map(bc => (
                      <Link key={bc.id} href={`/vente/bons-commande/${bc.id}`}
                        className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-indigo-300 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                          {bc.bl_id
                            ? <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                            : <AlertCircle size={18} className="text-amber-400 shrink-0" />
                          }
                          <div>
                            <p className="font-semibold text-gray-900">BC {bc.numero}</p>
                            <p className="text-sm text-gray-500">{formatDate(bc.date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatEuro(bc.total_bc)}</p>
                          <p className="text-xs text-gray-400">{bc.bl_id ? 'BL lié ✓' : 'Sans BL'}</p>
                        </div>
                      </Link>
                    ))}
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
