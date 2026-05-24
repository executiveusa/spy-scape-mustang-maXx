'use client'

import { FormEvent, Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function OperatorLoginForm() {
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/dashboard'
  const isUnconfigured = searchParams.get('auth') === 'unconfigured'
  const [password, setPassword] = useState('')
  const [tenantId, setTenantId] = useState('maxx-demo')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(
    isUnconfigured ? 'Operator auth is not configured yet. Set MAXX_OPERATOR_PASSWORD and MAXX_OPERATOR_SESSION_SECRET.' : null,
  )

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/operator-session/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          tenant_id: tenantId.trim() || 'maxx-demo',
        }),
      })
      const payload = (await response.json()) as { detail?: string }
      if (!response.ok) {
        throw new Error(payload.detail ?? 'Operator login failed.')
      }
      window.location.assign(nextPath.startsWith('/') ? nextPath : '/dashboard')
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Operator login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-4 text-left" onSubmit={onSubmit}>
      <label className="block">
        <span className="mb-2 block font-mono text-xs uppercase tracking-[0.22em] text-gray-500">
          Operator password
        </span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-maxx-cyan/50"
        />
      </label>

      <label className="block">
        <span className="mb-2 block font-mono text-xs uppercase tracking-[0.22em] text-gray-500">
          Tenant scope
        </span>
        <input
          value={tenantId}
          onChange={(event) => setTenantId(event.target.value)}
          placeholder="maxx-demo"
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-maxx-cyan/50"
        />
        <span className="mt-2 block text-xs leading-5 text-gray-600">
          Use a client ID for tenant-scoped work, or `all` for platform-wide operator setup.
        </span>
      </label>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-maxx-cyan/30 bg-maxx-cyan/10 px-5 py-3 font-mono text-xs uppercase tracking-[0.22em] text-maxx-cyan transition hover:bg-maxx-cyan/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
        Open command deck
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-maxx-black p-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(70,213,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(70,213,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <motion.div
        className="relative z-10 w-full max-w-sm text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="mb-8 flex justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Shield className="h-12 w-12 text-maxx-cyan" />
        </motion.div>

        <p className="mb-3 font-mono text-xs tracking-[0.4em] text-maxx-cyan">AGENT ACCESS</p>
        <h1 className="mb-4 font-heading text-2xl font-bold text-white">Agent MAXX Operator</h1>
        <div className="mx-auto mb-6 h-px w-12 bg-maxx-cyan/40" />

        <p className="mb-8 text-sm leading-relaxed text-gray-500">
          Operator access now protects the dashboard, tenant controls, deployment console, and Lead Desk review lane.
        </p>

        <Suspense fallback={<div className="text-sm text-gray-500">Loading secure console...</div>}>
          <OperatorLoginForm />
        </Suspense>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 font-mono text-sm text-maxx-cyan transition-all hover:gap-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Home
        </Link>
      </motion.div>
    </div>
  )
}
