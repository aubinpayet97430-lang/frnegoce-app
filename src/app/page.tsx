'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/commandes')
      else router.push('/login')
    })
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">Chargement...</p>
    </div>
  )
}
