'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AchatPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/achat/commandes') }, [router])
  return null
}
