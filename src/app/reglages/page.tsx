'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Save, User, Building2, Mail, Hash, Briefcase, CheckCircle } from 'lucide-react'

interface Profil {
  id?: string
  nom: string
  adresse: string
  siren: string
  email: string
  mention_activite: string
  conditions_reglement: string
}

export default function ReglagesPage() {
  const router = useRouter()
  const [profil, setProfil] = useState<Profil>({
    nom: '',
    adresse: '',
    siren: '',
    email: '',
    mention_activite: 'Agent Commercial Indépendant',
    conditions_reglement: 'Règlement par virement sous 5 jours ouvrés.',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const { data: p } = await supabase.from('profil_utilisateur').select('*').single()
      if (p) setProfil(prev => ({ ...prev, ...p }))
      setLoading(false)
    })
  }, [router])

  async function sauvegarder() {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      nom: profil.nom,
      adresse: profil.adresse,
      siren: profil.siren,
      email: profil.email,
      mention_activite: profil.mention_activite,
      conditions_reglement: profil.conditions_reglement,
    }
    if (profil.id) {
      await supabase.from('profil_utilisateur').update(payload).eq('id', profil.id)
    } else {
      const { data } = await supabase.from('profil_utilisateur').insert(payload).select().single()
      if (data) setProfil(data)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return (
    <><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Chargement...</p></div></>
  )

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Réglages</h1>
          <p className="text-gray-500 text-sm mt-1">Vos informations affichées sur les factures PDF</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <User size={14} /> Nom / Raison sociale
            </label>
            <input type="text" value={profil.nom}
              onChange={e => setProfil(p => ({ ...p, nom: e.target.value }))}
              placeholder="Ex : EI PAYET AUBIN"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Briefcase size={14} /> Activité
            </label>
            <input type="text" value={profil.mention_activite}
              onChange={e => setProfil(p => ({ ...p, mention_activite: e.target.value }))}
              placeholder="Ex : Agent Commercial Indépendant"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Hash size={14} /> SIREN
            </label>
            <input type="text" value={profil.siren}
              onChange={e => setProfil(p => ({ ...p, siren: e.target.value }))}
              placeholder="Ex : 944 976 141"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Building2 size={14} /> Ville / Adresse
            </label>
            <input type="text" value={profil.adresse}
              onChange={e => setProfil(p => ({ ...p, adresse: e.target.value }))}
              placeholder="Ex : Le Tampon, La Réunion"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Mail size={14} /> Email
            </label>
            <input type="email" value={profil.email}
              onChange={e => setProfil(p => ({ ...p, email: e.target.value }))}
              placeholder="Ex : contact@frnegoce.re"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Briefcase size={14} /> Conditions de règlement
            </label>
            <input type="text" value={profil.conditions_reglement}
              onChange={e => setProfil(p => ({ ...p, conditions_reglement: e.target.value }))}
              placeholder="Ex : Règlement par virement sous 5 jours ouvrés."
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <button onClick={sauvegarder} disabled={saving || !profil.nom.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 mt-2">
            {saved ? <><CheckCircle size={16} /> Enregistré !</> : saving ? 'Enregistrement...' : <><Save size={16} /> Enregistrer</>}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Ces informations apparaissent automatiquement sur toutes vos factures PDF.
        </p>
      </main>
    </>
  )
}
