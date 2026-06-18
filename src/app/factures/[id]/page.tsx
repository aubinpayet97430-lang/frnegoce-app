'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { ArrowLeft, Download, CheckCircle, XCircle, Clock, Trash2, Pencil, Check, X } from 'lucide-react'
import { formatEuro, formatDate } from '@/lib/utils'
import { genererPDFFacture } from '@/lib/pdfFacture'

interface LigneFacture {
  bl_numero: string
  nom_produit: string
  total: number
  eligible: boolean
}

interface Facture {
  id: string
  numero: string
  semaine: string
  date: string
  date_debut?: string
  date_fin?: string
  ca_eligible: number
  montant_commission: number
  statut: 'en_attente' | 'validee' | 'rejetee'
  lignes: LigneFacture[]
  commentaire?: string
  client?: { nom: string; adresse: string; siret?: string }
  conditions_reglement?: string
}

interface Profil {
  nom: string
  adresse: string
  siret?: string
  siren?: string
  email: string
  mention_activite?: string
  conditions_reglement?: string
}

export default function FactureDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [facture, setFacture] = useState<Facture | null>(null)
  const [profil, setProfil] = useState<Profil>({ nom: '', adresse: '', siret: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editNumero, setEditNumero] = useState(false)
  const [numeroEdit, setNumeroEdit] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const [{ data: f }, { data: p }] = await Promise.all([
        supabase.from('factures_commission').select('*').eq('id', id).single(),
        supabase.from('profil_utilisateur').select('*').single(),
      ])
      if (f) setFacture(f)
      if (p) setProfil(p)
      setLoading(false)
    })
  }, [id, router])

  async function sauvegarderNumero() {
    if (!facture || !numeroEdit.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('factures_commission').update({ numero: numeroEdit.trim() }).eq('id', id)
    setFacture(f => f ? { ...f, numero: numeroEdit.trim() } : f)
    setEditNumero(false)
    setSaving(false)
  }

  async function changerStatut(statut: 'en_attente' | 'validee' | 'rejetee') {
    if (!facture) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('factures_commission').update({ statut }).eq('id', id)
    setFacture(f => f ? { ...f, statut } : f)
    setSaving(false)
  }

  async function supprimer() {
    if (!confirm('Supprimer cette facture ?')) return
    const supabase = createClient()
    await supabase.from('factures_commission').delete().eq('id', id)
    router.push('/factures')
  }

  function telechargerPDF() {
    if (!facture) return
    const [anneeStr, semaineStr] = facture.semaine.split('-S')
    const sem = parseInt(semaineStr)
    const an = parseInt(anneeStr)
    const jan1 = new Date(an, 0, 1)
    const debut = new Date(jan1.getTime() + (sem - 1) * 7 * 86400000)
    const jour = debut.getDay() || 7
    debut.setDate(debut.getDate() - jour + 1)
    const fin = new Date(debut)
    fin.setDate(fin.getDate() + 6)

    genererPDFFacture({
      numero: facture.numero,
      semaine: sem,
      annee: an,
      date_debut: facture.date_debut || debut.toISOString().slice(0, 10),
      date_fin: facture.date_fin || fin.toISOString().slice(0, 10),
      date_emission: facture.date,
      profil: { nom: profil.nom, adresse: profil.adresse, siren: profil.siren || '', email: profil.email, mention_activite: profil.mention_activite },
      client: facture.client || { nom: 'SASU FR NÉGOCE', adresse: '', siret: '' },
      lignes: facture.lignes,
      ca_eligible: facture.ca_eligible,
      montant_commission: facture.montant_commission,
      mention_tva: 'TVA non applicable — Article 293B du CGI',
      conditions_reglement: facture.conditions_reglement || profil.conditions_reglement,
    })
  }

  if (loading || !facture) return (
    <><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Chargement...</p></div></>
  )

  const statutConfig = {
    en_attente: { label: 'En attente', icon: Clock, color: 'text-amber-600 bg-amber-100' },
    validee: { label: 'Validée', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100' },
    rejetee: { label: 'Rejetée', icon: XCircle, color: 'text-red-600 bg-red-100' },
  }
  const sc = statutConfig[facture.statut]
  const StatutIcon = sc.icon

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            {editNumero ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={numeroEdit}
                  onChange={e => setNumeroEdit(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sauvegarderNumero(); if (e.key === 'Escape') setEditNumero(false) }}
                  className="text-xl font-bold border border-indigo-400 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                />
                <button onClick={sauvegarderNumero} disabled={saving} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Check size={18} /></button>
                <button onClick={() => setEditNumero(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl font-bold text-gray-900">{facture.numero}</h1>
                <button onClick={() => { setNumeroEdit(facture.numero); setEditNumero(true) }}
                  className="p-1 text-gray-300 hover:text-indigo-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil size={15} />
                </button>
              </div>
            )}
            <p className="text-gray-500 text-sm">Semaine {facture.semaine} — {formatDate(facture.date)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={telechargerPDF}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors">
              <Download size={15} /> PDF
            </button>
            <button onClick={supprimer}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Statut actuel + actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Statut</p>
          <div className="flex items-center gap-3 mb-4">
            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold ${sc.color}`}>
              <StatutIcon size={15} /> {sc.label}
            </span>
            {facture.commentaire && (
              <p className="text-sm text-red-500 italic">{facture.commentaire}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => changerStatut('en_attente')}
              disabled={saving || facture.statut === 'en_attente'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-40 transition-colors">
              <Clock size={14} /> En attente
            </button>
            <button
              onClick={() => changerStatut('validee')}
              disabled={saving || facture.statut === 'validee'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 transition-colors">
              <CheckCircle size={14} /> Valider
            </button>
            <button
              onClick={() => changerStatut('rejetee')}
              disabled={saving || facture.statut === 'rejetee'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors">
              <XCircle size={14} /> Rejeter
            </button>
          </div>
        </div>

        {/* Récap montants */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-indigo-50 rounded-2xl p-4 text-center">
            <p className="text-xs text-indigo-500 mb-1">CA éligible HT</p>
            <p className="font-bold text-indigo-700 text-lg">{formatEuro(facture.ca_eligible)}</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 text-center">
            <p className="text-xs text-emerald-500 mb-1">Commission (4%)</p>
            <p className="font-bold text-emerald-700 text-lg">{formatEuro(facture.montant_commission)}</p>
          </div>
        </div>

        {/* Détail des lignes */}
        {facture.lignes && facture.lignes.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span>BL</span>
                <span>Produit</span>
                <span className="text-right">Montant</span>
              </div>
            </div>
            {facture.lignes.map((l, i) => (
              <div key={i} className="px-5 py-3.5 border-b border-gray-50 last:border-0">
                <div className="grid grid-cols-3 gap-2 items-center">
                  <p className="text-sm text-indigo-600 font-medium">BL {l.bl_numero}</p>
                  <p className="text-sm text-gray-800">{l.nom_produit}</p>
                  <p className="text-sm font-semibold text-gray-900 text-right">{formatEuro(l.total)}</p>
                </div>
              </div>
            ))}
            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-700">Total CA éligible</p>
              <p className="font-bold text-gray-900">{formatEuro(facture.ca_eligible)}</p>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
