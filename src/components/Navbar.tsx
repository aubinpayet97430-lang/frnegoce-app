'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LayoutDashboard, ShoppingCart, Truck, BookOpen, LogOut, Menu, X, ShoppingBag, Receipt, Settings } from 'lucide-react'
import { useState } from 'react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vente', label: 'Vente', icon: ShoppingCart },
  { href: '/achat', label: 'Achat', icon: Truck },
  { href: '/achat/besoins', label: 'Besoins', icon: ShoppingBag },
  { href: '/catalogue', label: 'Catalogue', icon: BookOpen },
  { href: '/factures', label: 'Factures', icon: Receipt },
  { href: '/reglages', label: 'Réglages', icon: Settings },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">F</span>
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">FR Négoce</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(href) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}>
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={logout} className="hidden md:flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm transition-colors">
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-gray-500">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                pathname.startsWith(href) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'
              }`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2.5 text-red-500 text-sm font-medium w-full">
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  )
}
