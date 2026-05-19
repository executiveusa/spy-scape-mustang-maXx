'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Building2, Loader2, Plus, Radio, Shield, Sparkles } from 'lucide-react'

type Tenant = {
  client_id: string
  slug: string
  status: string
  created_at: string
  updated_at: string
  manifest: {
    business: {
      public_name: string
      industry: string
      timezone: string
      geography: string[]
      summary: string
    }
    enabled_workflows: string[]
  }
  maxx_runtime: {
    profile_name: string
    status: string
    provider: string
    model: string
    profile_home: string
  }
}

type TenantPayload = {
  clients: Tenant[]
  detail?: string
}

const emptyForm = {
  client_id: '',
  public_name: '',
  industry: 'Local Services',
  timezone: 'America/Mexico_City',
  geography: 'Remote',
  summary: 'Client smart site tenant for the Agent MAXX Lead Desk employee.',
  primary_offer: 'Lead Desk Automation',
  operator_email: '',
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [provisioningId, setProvisioningId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const loadTenants = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tenants', { cache: 'no-store' })
      const payload = (await response.json()) as TenantPayload
      setTenants(payload.clients ?? [])
      if (payload.detail) {
        setError(payload.detail)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Tenant registry failed to load.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTenants()
  }, [])

  const onChange = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const createTenant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          geography: form.geography
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      })
      const payload = (await response.json()) as Tenant | { detail?: string }

      if (!response.ok) {
        throw new Error('detail' in payload && payload.detail ? payload.detail : 'Tenant creation failed.')
      }

      setMessage(`Tenant ${(payload as Tenant).client_id} created. Provision the Agent MAXX profile when ready.`)
      setForm(emptyForm)
      await loadTenants()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Tenant creation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const provisionTenant = async (clientId: string) => {
    setProvisioningId(clientId)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'provision', client_id: clientId }),
      })
      const payload = (await response.json()) as Tenant | { detail?: string }

      if (!response.ok) {
        throw new Error('detail' in payload && payload.detail ? payload.detail : 'Provisioning failed.')
      }

      const tenant = payload as Tenant
      setMessage(`Tenant ${tenant.client_id} provisioned as ${tenant.status}; Agent MAXX profile status is ${tenant.maxx_runtime.status}.`)
      await loadTenants()
    } catch (provisionError) {
      setError(provisionError instanceof Error ? provisionError.message : 'Provisioning failed.')
    } finally {
      setProvisioningId(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#050810] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.35em] text-cyan-400/80">
              <Shield className="h-4 w-4" />
              Tenant Control
            </div>
            <h1 className="max-w-4xl text-4xl font-black uppercase tracking-[0.08em] text-white sm:text-5xl">
              one client, one manifest, one MAXX employee profile
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
              This operator surface creates tenant records, seeds the smart-site manifest, and provisions
              the Agent MAXX profile binding that the Lead Desk workflow depends on.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/lead-desk"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-400/20"
            >
              <Sparkles className="h-4 w-4" />
              Lead Desk
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-cyan-400/40 hover:text-white"
            >
              Command Deck
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <MetricCard label="Tenants" value={`${tenants.length}`} detail="Client records in the MAXX control plane." />
          <MetricCard
            label="Profiles Ready"
            value={`${tenants.filter((tenant) => tenant.maxx_runtime.status === 'ready').length}`}
            detail="Agent MAXX profiles with full runtime setup."
          />
          <MetricCard
            label="Lead Desk Enabled"
            value={`${tenants.filter((tenant) => tenant.manifest.enabled_workflows.includes('lead-desk')).length}`}
            detail="Tenants with the first employee workflow active."
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-5">
              <h2 className="font-mono text-sm uppercase tracking-[0.35em] text-cyan-400">Create tenant</h2>
              <p className="mt-2 text-sm text-white/60">
                Keep this boring on purpose: identity, routing context, and the first workflow.
              </p>
            </div>

            <form className="space-y-4" onSubmit={createTenant}>
              <FormField label="Client ID">
                <input
                  value={form.client_id}
                  onChange={(event) => onChange('client_id', event.target.value)}
                  placeholder="acme-dental"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                />
              </FormField>
              <FormField label="Public name">
                <input
                  value={form.public_name}
                  onChange={(event) => onChange('public_name', event.target.value)}
                  placeholder="Acme Dental Studio"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Industry">
                  <input
                    value={form.industry}
                    onChange={(event) => onChange('industry', event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  />
                </FormField>
                <FormField label="Timezone">
                  <input
                    value={form.timezone}
                    onChange={(event) => onChange('timezone', event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  />
                </FormField>
              </div>
              <FormField label="Geography">
                <input
                  value={form.geography}
                  onChange={(event) => onChange('geography', event.target.value)}
                  placeholder="Austin, Remote US"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                />
              </FormField>
              <FormField label="Summary">
                <textarea
                  value={form.summary}
                  onChange={(event) => onChange('summary', event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                />
              </FormField>

              {message ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                  {message}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create tenant
              </button>
            </form>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-mono text-sm uppercase tracking-[0.35em] text-cyan-400">Tenant registry</h2>
                <p className="mt-2 text-sm text-white/60">Provisioned and pending client profiles.</p>
              </div>
              <button
                type="button"
                onClick={() => void loadTenants()}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:border-cyan-400/30 hover:text-white"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-white/65">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                Loading tenants...
              </div>
            ) : tenants.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-white/65">
                No tenants returned by the control plane.
              </div>
            ) : (
              <div className="space-y-3">
                {tenants.map((tenant) => (
                  <article key={tenant.client_id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-cyan-400" />
                          <p className="font-semibold text-white">{tenant.manifest.business.public_name}</p>
                        </div>
                        <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/40">
                          {tenant.client_id} / {tenant.manifest.business.industry}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={tenant.status} />
                        <StatusBadge status={tenant.maxx_runtime.status} />
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-white/65">{tenant.manifest.business.summary}</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <MiniCard label="Profile" value={tenant.maxx_runtime.profile_name} />
                      <MiniCard label="Provider" value={tenant.maxx_runtime.provider} />
                      <MiniCard label="Workflow" value={tenant.manifest.enabled_workflows.join(', ')} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={provisioningId === tenant.client_id}
                        onClick={() => void provisionTenant(tenant.client_id)}
                        className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {provisioningId === tenant.client_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Radio className="h-3.5 w-3.5" />
                        )}
                        Provision profile
                      </button>
                      <Link
                        href={`/lead-desk`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:border-cyan-400/30 hover:text-white"
                      >
                        Open Lead Desk
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-xs uppercase tracking-[0.22em] text-white/45">{label}</span>
      {children}
    </label>
  )
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/40">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-white/60">{detail}</p>
    </div>
  )
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#050810] px-4 py-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-2 truncate text-sm text-white/80">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    ready: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    degraded: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200',
    'vendor-missing': 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200',
    pending: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
    'provisioning-required': 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
  }

  return (
    <span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${styles[status] ?? 'border-white/10 bg-white/5 text-white/60'}`}>
      {status}
    </span>
  )
}
