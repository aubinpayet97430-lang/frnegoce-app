'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { ArrowLeft, FileText } from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import { genererPDFFacture } from '@/lib/pdfFacture'

interface BL {
  id: string
  numero: string
  date: string
  lignes: { nom_produit: string; quantite_caisses: number; pcb: number; unite: string; prix_unitaire: number; total: number }[]
  total_bl: number
}

interface LigneSelectionnee {
  bl_id: string
  bl_numero: string
  nom_produit: string
  total: number
  eligible: boolean
}

interface Profil {
  nom: string
  adresse: string
  siren: string
  email: string
  mention_activite: string
  conditions_reglement: string
}

interface Client {
  nom: string
  adresse: string
  siret: string
}

function getNumSemaine(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function getDatesFromSemaine(semaine: number, annee: number) {
  const jan1 = new Date(annee, 0, 1)
  const debut = new Date(jan1.getTime() + (semaine - 1) * 7 * 86400000)
  const jour = debut.getDay() || 7
  debut.setDate(debut.getDate() - jour + 1)
  const fin = new Date(debut)
  fin.setDate(fin.getDate() + 6)
  return { debut: debut.toISOString().slice(0, 10), fin: fin.toISOString().slice(0, 10) }
}

export default function NouvelleFacturePage() {
  const router = useRouter()
  const [semaine, setSemaine] = useState(getNumSemaine(new Date()))
  const [annee, setAnnee] = useState(new Date().getFullYear())
  const [bls, setBls] = useState<BL[]>([])
  const [lignes, setLignes] = useState<LigneSelectionnee[]>([])
  const [profil, setProfil] = useState<Profil>({ nom: '', adresse: '', siren: '', email: '', mention_activite: '', conditions_reglement: '' })
  const [client, setClient] = useState<Client>({ nom: 'SASU FR NÉGOCE', adresse: '', siret: '' })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const { data: p } = await supabase.from('profil_utilisateur').select('*').single()
      if (p) setProfil(prev => ({ ...prev, ...p }))
    })
  }, [router])

  async function chargerSemaine() {
    setLoading(true)
    const supabase = createClient()
    const { debut, fin } = getDatesFromSemaine(semaine, annee)
    const { data } = await supabase.from('bons_livraison_vente').select('*').gte('date', debut).lte('date', fin).order('date')
    const blsData: BL[] = data || []
    setBls(blsData)
    const lignesMap: LigneSelectionnee[] = []
    blsData.forEach(bl => {
      bl.lignes.forEach(l => {
        lignesMap.push({ bl_id: bl.id, bl_numero: bl.numero, nom_produit: l.nom_produit, total: l.total, eligible: false })
      })
    })
    setLignes(lignesMap)
    setLoading(false)
  }

  function toggleEligible(idx: number) {
    setLignes(prev => prev.map((l, i) => i === idx ? { ...l, eligible: !l.eligible } : l))
  }

  function toggleBL(blId: string) {
    const blLignes = lignes.filter(l => l.bl_id === blId)
    const toutesEligibles = blLignes.every(l => l.eligible)
    setLignes(prev => prev.map(l => l.bl_id === blId ? { ...l, eligible: !toutesEligibles } : l))
  }

  const caEligible = lignes.filter(l => l.eligible).reduce((s, l) => s + l.total, 0)
  const commission = caEligible * 0.04

  async function generer() {
    if (!profil.nom || caEligible === 0) return
    setSaving(true)
    const supabase = createClient()
    const { count } = await supabase.from('factures_commission').select('*', { count: 'exact', head: true })
    const numero = `FAC-${annee}-${String((count || 0) + 1).padStart(3, '0')}`
    const lignesEligibles = lignes.filter(l => l.eligible)
    const dateEmission = new Date().toISOString().slice(0, 10)
    const { debut, fin } = getDatesFromSemaine(semaine, annee)

    genererPDFFacture({
      numero, semaine, annee,
      date_debut: debut, date_fin: fin, date_emission: dateEmission,
      profil, client, lignes: lignesEligibles,
      ca_eligible: caEligible, montant_commission: commission,
      mention_tva: 'TVA non applicable — Article 293B du CGI',
      conditions_reglement: profil.conditions_reglement,
    })

    await supabase.from('factures_commission').insert({
      numero, semaine: `${annee}-S${semaine}`, date: dateEmission,
      ca_eligible: caEligible, montant_commission: commission,
      statut: 'en_attente', lignes: lignesEligibles,
      client, date_debut: debut, date_fin: fin,
      conditions_reglement: profil.conditions_reglement,
    })

    router.push('/factures')
  }

  const blIds = [...new Set(lignes.map(l => l.bl_id))]

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nouvelle facture</h1>
            <p className="text-sm text-gray-500">Commission 4% du CA HT éligible</p>
          </div>
        </div>

        {/* Client */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Facturé à</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nom / Raison sociale</label>
              <input type="text" value={client.nom} onChange={e => setClient(c => ({ ...c, nom: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Adresse</label>
                <input type="text" value={client.adresse} onChange={e => setClient(c => ({ ...c, adresse: e.target.value }))}
                  placeholder="07 Chemin de l'Océan — 97450 Saint-Louis"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">SIRET client</label>
                <input type="text" value={client.siret} onChange={e => setClient(c => ({ ...c, siret: e.target.value }))}
                  placeholder="818 154 635 000 10"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Sélection semaine */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Sélectionner la semaine</p>
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Semaine</label>
              <input type="number" min="1" max="53" value={semaine} onChange={e => setSemaine(parseInt(e.target.value))}
                className="w-24 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Année</label>
              <input type="number" value={annee} onChange={e => setAnnee(parseInt(e.target.value))}
                className="w-28 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button onClick={chargerSemaine} disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
              {loading ? 'Chargement...' : 'Charger les BL'}
            </button>
          </div>
        </div>

        {/* BL et produits */}
        {bls.length > 0 && (
          <div className="space-y-3 mb-4">
            <p className="text-sm font-semibold text-gray-700">{bls.length} BL trouvé{bls.length > 1 ? 's' : ''} — cochez les produits éligibles</p>
            {blIds.map(blId => {
              const blLignes = lignes.filter(l => l.bl_id === blId)
              const bl = bls.find(b => b.id === blId)
              const toutesEligibles = blLignes.every(l => l.eligible)
              return (
                <div key={blId} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <input type="checkbox" checked={toutesEligibles} onChange={() => toggleBL(blId)} className="w-4 h-4 accent-indigo-600" />
                    <p className="font-semibold text-gray-800 text-sm">BL {bl?.numero} — {bl ? new Date(bl.date).toLocaleDateString('fr-FR') : ''}</p>
                    <p className="ml-auto text-sm font-bold text-gray-700">{formatEuro(bl?.total_bl || 0)}</p>
                  </div>
                  {blLignes.map((l) => {
                    const realIdx = lignes.indexOf(l)
                    return (
                      <div key={realIdx} onClick={() => toggleEligible(realIdx)}
                        className={`flex items-center gap-3 px-5 py-3 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${l.eligible ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                        <input type="checkbox" checked={l.eligible} onChange={() => toggleEligible(realIdx)}
                          className="w-4 h-4 accent-indigo-600" onClick={e => e.stopPropagation()} />
                        <p className="flex-1 text-sm text-gray-800">{l.nom_produit}</p>
                        <p className={`text-sm font-semibold ${l.eligible ? 'text-indigo-700' : 'text-gray-500'}`}>{formatEuro(l.total)}</p>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {bls.length === 0 && !loading && lignes.length === 0 && (
          <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-200">
            <FileText size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chargez une semaine pour voir les BL</p>
          </div>
        )}

        {caEligible > 0 && (
          <div className="bg-indigo-600 rounded-2xl p-5 mb-4">
            <div className="grid grid-cols-2 gap-3 text-white">
              <div>
                <p className="text-xs opacity-70">CA éligible HT</p>
                <p className="text-xl font-bold">{formatEuro(caEligible)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Commission (4%)</p>
                <p className="text-xl font-bold">{formatEuro(commission)}</p>
              </div>
            </div>
          </div>
        )}

        <button onClick={generer} disabled={saving || caEligible === 0 || !profil.nom}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-2xl transition-colors disabled:opacity-50">
          {saving ? 'Génération...' : 'Générer la facture PDF'}
        </button>
      </main>
    </>
  )
}
