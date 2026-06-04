'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { ArrowLeft, Download, Paperclip, Eye, Trash2 } from 'lucide-react'
import { genererPDF } from '@/lib/pdf'
import { BonCommande, BonLivraison } from '@/types'

export default function CommandeDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [bc, setBc] = useState<BonCommande | null>(null)
  const [bl, setBl] = useState<BonLivraison | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/login'); return }
      const { data: bcData } = await supabase.from('bons_commande').select('*').eq('id', id).single()
      if (bcData) {
        setBc(bcData)
        if (bcData.bl_id) {
          const { data: blData } = await supabase.from('bons_livraison').select('*').eq('id', bcData.bl_id).single()
          setBl(blData)
        }
      }
      setLoading(false)
    })
  }, [id, router])

  async function uploadBL(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !bc) return
    setUploading(true)
    const supabase = createClient()
    const path = `bls/${bc.id}/${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file)
    if (upErr) { setUploading(false); return }
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
    const { data: blData } = await supabase
      .from('bons_livraison')
      .insert({ date: new Date().toISOString().split('T')[0], photo_url: urlData.publicUrl, bc_id: bc.id })
      .select()
      .single()
    if (blData) {
      await supabase.from('bons_commande').update({ bl_id: blData.id }).eq('id', bc.id)
      setBl(blData)
      setBc((prev) => prev ? { ...prev, bl_id: blData.id } : prev)
    }
    setUploading(false)
  }

  async function detacherBL() {
    if (!bc || !bl) return
    const supabase = createClient()
    await supabase.from('bons_commande').update({ bl_id: null }).eq('id', bc.id)
    await supabase.from('bons_livraison').delete().eq('id', bl.id)
    setBl(null)
    setBc((prev) => prev ? { ...prev, bl_id: undefined } : prev)
  }

  if (loading || !bc) return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Chargement...</p>
      </div>
    </>
  )

  const total = bc.lignes.reduce((s, l) => s + l.quantite * l.prix, 0)

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">BC {bc.numero}</h1>
            <p className="text-sm text-gray-500">
              {new Date(bc.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => genererPDF(bc)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Download size={15} />
            PDF
          </button>
        </div>

        {/* Client */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Client</p>
          <p className="font-semibold text-gray-900">Vindemia Logistique</p>
        </div>

        {/* Lignes */}
        <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Produits commandés</p>
          </div>
          {bc.lignes.map((l, i) => (
            <div key={i} className="px-4 py-3 border-b border-gray-50 last:border-0 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{l.nom}</p>
                <p className="text-sm text-gray-500">{l.quantite} {l.unite} × {l.prix.toFixed(2)} €</p>
              </div>
              <p className="font-semibold text-gray-900">{(l.quantite * l.prix).toFixed(2)} €</p>
            </div>
          ))}
          <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
            <p className="font-semibold text-gray-700">Total</p>
            <p className="text-lg font-bold text-gray-900">{total.toFixed(2)} €</p>
          </div>
        </div>

        {/* BL */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Bon de Livraison</p>
            {bl && (
              <button onClick={detacherBL} className="text-red-400 hover:text-red-600 transition-colors">
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {bl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2">
                <Paperclip size={15} />
                <span className="text-sm font-medium">BL lié — {new Date(bl.date).toLocaleDateString('fr-FR')}</span>
              </div>
              <a
                href={bl.photo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <Eye size={15} />
                Voir la photo du BL
              </a>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-400 mb-3">Aucun BL associé à cette commande.</p>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-green-400 rounded-xl py-3 cursor-pointer transition-colors">
                <input type="file" accept="image/*" onChange={uploadBL} className="hidden" />
                {uploading ? (
                  <span className="text-sm text-gray-400">Upload en cours...</span>
                ) : (
                  <>
                    <Paperclip size={15} className="text-gray-400" />
                    <span className="text-sm text-gray-500 font-medium">Joindre la photo du BL</span>
                  </>
                )}
              </label>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
