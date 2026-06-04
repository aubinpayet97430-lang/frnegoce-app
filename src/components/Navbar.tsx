'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ClipboardList, FileText, LogOut } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const links = [
    { href: '/commandes', label: 'Commandes', icon: ClipboardList },
    { href: '/bons', label: 'BL / BC', icon: FileText },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-xs font-bold">F</span>
          </div>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Déconnexion"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  )
}
