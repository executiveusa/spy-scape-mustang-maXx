'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  DatabaseZap,
  Loader2,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react'

type SourceStatus = {
  source: string
  label: string
  status: 'online' | 'warning' | 'offline'
  configured: boolean
  enabled: boolean
  detail: string
}

type Evidence = {
  evidence_id: string
  label: string
  url?: string | null
  excerpt: string
  captured_at: string
}

type Prospect = {
  prospect_id: string
  status: string
  source: string
  name?: string | null
  title?: string | null
  company: string
  email?: string | null
  phone?: string | null
  linkedin_url?: string | null
  organization_domain?: string | null
  location?: string | null
  score: number
  confidence: string
  reasons: string[]
  evidence: Evidence[]
  promoted_task_id?: string | null
}

type AcquisitionJob = {
  job_id: string
  status: string
  query: string
  discovered_count: number
  qualified_count: number
  rejected_count: number
  events: string[]
  created_at: string
}

type AcquisitionPayload = {
  status: string
  sources: SourceStatus[]
  jobs: AcquisitionJob[]
  prospects: Prospect[]
  manifest?: {
    business?: {
      public_name?: string
      geography?: string[]
    }
  }
}

const seedProspects = [
  {
    name: 'Morgan Hale',
    title: 'Founder',
    company: 'Northstar Growth Studio',
    email: 'morgan@example.com',
    phone: '+1-555-0144',
    linkedin_url: 'https://www.linkedin.com/in/example-morgan-hale',
    organization_domain: 'northstargrowth.example',
    location: 'Austin',
    seniority: 'Founder',
    department: 'Executive',
    notes: 'Owner-approved sample prospect. Founder exploring lead follow-up and smart-site intake.',
    source_url: 'https://example.com/prospects/northstar',
  },
  {
    name: 'Jordan Pike',
    title: 'Operations Director',
    company: 'Blue Harbor Services',
    email: 'jordan@example.com',
    organization_domain: 'blueharbor.example',
    location: 'Dallas',
    seniority: 'Director',
    department: 'Operations',
    notes: 'Needs faster inquiry response and fewer handoff mistakes across booking routes.',
    source_url: 'https://example.com/prospects/blue-harbor',
  },
]

export default function LeadAcquisitionPage() {
  const [payload, setPayload] = useState<AcquisitionPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/lead-acquisition', { cache: 'no-store' })
      const nextPayload = (await response.json()) as AcquisitionPayload
      setPayload(nextPayload)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Lead Acquisition failed to load.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const qualified = useMemo(
    () => (payload?.prospects ?? []).filter((prospect) => prospect.status === 'qualified').length,
    [payload],
  )
  const promoted = useMemo(
    () => (payload?.prospects ?? []).filter((prospect) => prospect.status === 'promoted').length,
    [payload],
  )

  const createCanaryJob = async () => {
    setWorkingId('new-job')
    setMessage(null)
    setError(null)
    try {
      const response = await fetch('/api/lead-acquisition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: 'maxx-demo',
          source: 'authorized-contact-import',
          query: 'Owner-approved demo prospects for Lead Desk review.',
          max_records: seedProspects.length,
          prospects: seedProspects,
        }),
      })
      const result = (await response.json()) as AcquisitionJob | { detail?: string }
      if (!response.ok) {
        throw new Error('detail' in result && result.detail ? result.detail : 'Lead Acquisition job failed.')
      }
      setMessage(`Lead Acquisition job ${(result as AcquisitionJob).job_id} completed.`)
      await load()
    } catch (jobError) {
      setError(jobError instanceof Error ? jobError.message : 'Lead Acquisition job failed.')
    } finally {
      setWorkingId(null)
    }
  }

  const prospectAction = async (prospectId: string, action: 'promote' | 'reject') => {
    setWorkingId(`${action}:${prospectId}`)
    setMessage(null)
    setError(null)
    try {
      const response = await fetch('/api/lead-acquisition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          prospect_id: prospectId,
          note:
            action === 'promote'
              ? 'Operator approved this prospect for Lead Desk review.'
              : 'Operator rejected this prospect before outreach.',
        }),
      })
      const result = (await response.json()) as { detail?: string; lead_desk_task?: { task_id?: string } }
      if (!response.ok) {
        throw new Error(result.detail ?? `Prospect ${action} failed.`)
      }
      setMessage(
        action === 'promote'
          ? `Prospect promoted into Lead Desk task ${result.lead_desk_task?.task_id ?? ''}.`
          : 'Prospect rejected before outreach.',
      )
      await load()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Prospect ${action} failed.`)
    } finally {
      setWorkingId(null)
    }
  }

  const prospects = payload?.prospects ?? []
  const sources = payload?.sources ?? []
  const jobs = payload?.jobs ?? []

  return (
    <main className="min-h-screen bg-[#050810] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.35em] text-cyan-400/80">
              <Radar className="h-4 w-4" />
              Lead Acquisition
            </div>
            <h1 className="max-w-4xl text-4xl font-black uppercase tracking-[0.08em] text-white sm:text-5xl">
              find the right prospects, then hand them to Lead Desk with evidence
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
              Agent MAXX is not a raw scraper. This console turns owner-approved discovery into scored,
              deduped prospects that an operator can review before anything becomes outreach.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/lead-desk"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-400/20"
            >
              Lead Desk
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-cyan-400/40 hover:text-white"
            >
              Command Deck
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="Sources" value={`${sources.filter((source) => source.enabled).length}/${sources.length}`} detail="Private acquisition lanes enabled." />
          <MetricCard label="Prospects" value={`${prospects.length}`} detail="Canonical MAXX records for review." />
          <MetricCard label="Qualified" value={`${qualified}`} detail="Strong fit and contact evidence." />
          <MetricCard label="Promoted" value={`${promoted}`} detail="Converted into Lead Desk tasks." />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-5 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <h2 className="font-mono text-sm uppercase tracking-[0.32em] text-cyan-400">
                  Source controls
                </h2>
              </div>
              <div className="space-y-3">
                {sources.map((source) => (
                  <div key={source.source} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{source.label}</p>
                      <StatusBadge status={source.enabled ? 'enabled' : source.status} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/60">{source.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-5 flex items-center gap-2">
                <DatabaseZap className="h-4 w-4 text-cyan-400" />
                <h2 className="font-mono text-sm uppercase tracking-[0.32em] text-cyan-400">
                  Safe canary job
                </h2>
              </div>
              <p className="text-sm leading-6 text-white/65">
                Seed two owner-approved sample prospects. This proves normalization, scoring, dedupe,
                evidence capture, and promotion without autonomous browsing.
              </p>
              <button
                type="button"
                onClick={() => void createCanaryJob()}
                disabled={workingId === 'new-job'}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {workingId === 'new-job' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Run safe acquisition pass
              </button>
              {message ? <Notice tone="success">{message}</Notice> : null}
              {error ? <Notice tone="error">{error}</Notice> : null}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-5 flex items-center gap-2">
                <Target className="h-4 w-4 text-cyan-400" />
                <h2 className="font-mono text-sm uppercase tracking-[0.32em] text-cyan-400">
                  Recent jobs
                </h2>
              </div>
              {jobs.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-white/60">
                  No acquisition jobs yet. Run the safe pass to seed the first prospects.
                </p>
              ) : (
                <div className="space-y-3">
                  {jobs.slice(0, 4).map((job) => (
                    <div key={job.job_id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/45">{job.job_id}</p>
                        <StatusBadge status={job.status} />
                      </div>
                      <p className="mt-2 text-sm text-white/75">{job.query}</p>
                      <p className="mt-2 text-xs text-white/45">
                        {job.discovered_count} discovered, {job.qualified_count} qualified, {job.rejected_count} rejected
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-mono text-sm uppercase tracking-[0.32em] text-cyan-400">
                  Prospect review
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  {payload?.manifest?.business?.public_name ?? 'MAXX Demo'} review queue.
                </p>
              </div>
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-cyan-400" /> : null}
            </div>

            {prospects.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-8 text-sm text-white/60">
                No prospects yet. Run the safe acquisition pass to create scored records.
              </div>
            ) : (
              <div className="space-y-4">
                {prospects.map((prospect) => (
                  <div key={prospect.prospect_id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-white">{prospect.company}</p>
                        <p className="mt-1 text-sm text-white/55">
                          {[prospect.name, prospect.title, prospect.location].filter(Boolean).join(' / ') || 'Contact pending'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={prospect.status} />
                        <ScoreBadge score={prospect.score} />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <MiniCard label="Confidence" value={prospect.confidence} />
                      <MiniCard label="Email" value={prospect.email ?? 'missing'} />
                      <MiniCard label="Domain" value={prospect.organization_domain ?? 'missing'} />
                    </div>

                    <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-3">
                      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">Why MAXX flagged it</p>
                      <div className="mt-3 space-y-2">
                        {prospect.reasons.map((reason) => (
                          <div key={reason} className="flex items-start gap-2 text-sm text-white/65">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {prospect.evidence.map((item) => (
                        <div key={item.evidence_id} className="rounded-2xl border border-white/10 bg-[#050810] px-4 py-3">
                          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">{item.label}</p>
                          <p className="mt-2 text-sm text-white/65">{item.excerpt}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={Boolean(prospect.promoted_task_id) || workingId === `promote:${prospect.prospect_id}`}
                        onClick={() => void prospectAction(prospect.prospect_id, 'promote')}
                        className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {workingId === `promote:${prospect.prospect_id}` ? 'Promoting' : 'Promote to Lead Desk'}
                      </button>
                      <button
                        type="button"
                        disabled={prospect.status === 'rejected' || prospect.status === 'promoted' || workingId === `reject:${prospect.prospect_id}`}
                        onClick={() => void prospectAction(prospect.prospect_id, 'reject')}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:border-red-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
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
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-2 break-words text-sm text-white/80">{value}</p>
    </div>
  )
}

function Notice({ tone, children }: { tone: 'success' | 'error'; children: React.ReactNode }) {
  const styles =
    tone === 'success'
      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
      : 'border-red-400/20 bg-red-400/10 text-red-300'
  return <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${styles}`}>{children}</div>
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    enabled: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    online: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    qualified: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    promoted: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
    enriched: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200',
    'needs-review': 'border-orange-400/20 bg-orange-400/10 text-orange-200',
    warning: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200',
    rejected: 'border-red-400/20 bg-red-400/10 text-red-300',
    blocked: 'border-red-400/20 bg-red-400/10 text-red-300',
    degraded: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200',
    completed: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  }

  return (
    <span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${styles[status] ?? 'border-white/10 bg-white/5 text-white/60'}`}>
      {status}
    </span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const style =
    score >= 75
      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
      : score >= 55
        ? 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200'
        : 'border-orange-400/20 bg-orange-400/10 text-orange-200'
  return (
    <span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${style}`}>
      {score}/100
    </span>
  )
}
