'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, Building2, LayoutDashboard, LogOut, Radar, Rocket, Shield, UserRound } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Command', icon: LayoutDashboard },
  { href: '/lead-desk', label: 'Lead Desk', icon: UserRound },
  { href: '/lead-acquisition', label: 'Acquisition', icon: Radar },
  { href: '/tenants', label: 'Tenants', icon: Building2 },
  { href: '/deploy', label: 'Deploy', icon: Rocket },
]

export default function OperatorNav() {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/operator-session/', { method: 'DELETE' }).catch(() => undefined)
    router.replace('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050810]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 shadow-[0_0_28px_rgba(70,213,255,0.16)]">
            <Shield className="h-5 w-5 text-cyan-200 transition group-hover:scale-110" />
          </span>
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.3em] text-white">Agent MAXX</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200/70">
              Operator Control Room
            </span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition ${
                  active
                    ? 'border-cyan-300/35 bg-cyan-300 text-black'
                    : 'border-white/10 bg-white/[0.035] text-white/62 hover:border-cyan-300/35 hover:text-white'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            )
          })}
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/62 transition hover:border-cyan-300/35 hover:text-white"
          >
            Public
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 rounded-full border border-red-300/15 bg-red-400/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-red-100/75 transition hover:border-red-300/35 hover:text-red-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit
          </button>
        </nav>
      </div>
    </header>
  )
}
