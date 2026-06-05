'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function VentePage() {
  const router = useRouter()
  useEffect(() => { router.replace('/vente/bons-commande') }, [router])
  return null
}
