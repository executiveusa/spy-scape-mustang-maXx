'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  Radio,
  Send,
  Shield,
  Sparkles,
  UserRound,
} from 'lucide-react'

type LeadDeskTask = {
  task_id: string
  status: string
  client_id: string
  route_target: string
  operator_summary: string
  created_at: string
  qualification: {
    tier: 'hot' | 'warm' | 'cold'
    score: number
    next_action: string
  }
  hermes_dispatch: {
    status: string
    provider: string
    model: string
    configured: boolean
    notes: string[]
    response_excerpt?: string | null
  }
  follow_up_actions: string[]
}

type LeadDeskPayload = {
  status: string
  workflow_count: number
  tasks: LeadDeskTask[]
  target: string
  providers: Array<{
    provider: string
    model: string
    configured: boolean
    execution_ready: boolean
  }>
  manifest?: {
    business?: {
      public_name?: string
      summary?: string
      offers?: Array<{ label: string; outcome: string }>
    }
  }
}

const emptyForm = {
  client_id: 'maxx-demo',
  contact_name: '',
  company: '',
  email: '',
  phone: '',
  message: '',
  requested_service: 'lead-desk',
  budget_band: '',
  timeline: '',
  preferred_channel: 'email',
  source: 'site',
}

export default function LeadDeskPage() {
  const [payload, setPayload] = useState<LeadDeskPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const loadLeadDesk = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/lead-desk', { cache: 'no-store' })
      const nextPayload = (await response.json()) as LeadDeskPayload
      setPayload(nextPayload)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Lead Desk surface failed to load.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadLeadDesk()
  }, [])

  const provider = payload?.providers?.[0]
  const tasks = payload?.tasks ?? []
  const hotTasks = useMemo(
    () => tasks.filter((task) => task.qualification?.tier === 'hot').length,
    [tasks],
  )

  const onChange = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/lead-desk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const result = (await response.json()) as LeadDeskTask | { detail?: string }
      if (!response.ok) {
        throw new Error('detail' in result && result.detail ? result.detail : 'Lead Desk submission failed.')
      }

      const nextTask = result as LeadDeskTask
      setSubmitMessage(
        `Lead Desk task ${nextTask.task_id} created as ${nextTask.status}. Hermes dispatch: ${nextTask.hermes_dispatch.status}.`,
      )
      setForm(emptyForm)
      await loadLeadDesk()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Lead Desk submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateTask = async (taskId: string, status: 'follow-up' | 'completed') => {
    setUpdatingTaskId(taskId)
    setError(null)
    setSubmitMessage(null)

    try {
      const response = await fetch('/api/lead-desk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: taskId,
          status,
          note: status === 'completed' ? 'Operator marked this task complete.' : 'Operator moved this task into follow-up.',
        }),
      })

      const result = (await response.json()) as LeadDeskTask | { detail?: string }
      if (!response.ok) {
        throw new Error('detail' in result && result.detail ? result.detail : 'Lead Desk update failed.')
      }

      setSubmitMessage(`Lead Desk task ${taskId} moved to ${status}.`)
      await loadLeadDesk()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Lead Desk update failed.')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#050810] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.35em] text-cyan-400/80">
              <Shield className="h-4 w-4" />
              Lead Desk
            </div>
            <h1 className="max-w-3xl text-4xl font-black uppercase tracking-[0.08em] text-white sm:text-5xl">
              one smart-site intake lane, one visible operator queue
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
              This is the first true employee surface in Agent MAXX. It captures an inquiry, qualifies
              it, records the tenant context, and shows the operator exactly what Hermes did or did not do.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-400/20"
            >
              <Sparkles className="h-4 w-4" />
              Command Deck
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-cyan-400/40 hover:text-white"
            >
              Public Site
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="Workflow Packs" value={`${payload?.workflow_count ?? 0}`} detail="Lead Desk is the first live pack." />
          <MetricCard label="Open Tasks" value={`${tasks.length}`} detail="Visible operator queue for the demo tenant." />
          <MetricCard label="Hot Leads" value={`${hotTasks}`} detail="Near-term opportunities routed toward calendar action." />
          <MetricCard
            label="Hermes Router"
            value={provider?.configured ? 'ready' : 'degraded'}
            detail={provider?.configured ? provider.model : 'OpenRouter key still missing for live execution.'}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-5">
              <h2 className="font-mono text-sm uppercase tracking-[0.35em] text-cyan-400">Live intake</h2>
              <p className="mt-2 text-sm text-white/60">
                Submit an inquiry through the same frontend lane the future smart site will use.
              </p>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <FormField label="Contact name">
                <input
                  value={form.contact_name}
                  onChange={(event) => onChange('contact_name', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  required
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Email">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => onChange('email', event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  />
                </FormField>
                <FormField label="Phone">
                  <input
                    value={form.phone}
                    onChange={(event) => onChange('phone', event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Company">
                  <input
                    value={form.company}
                    onChange={(event) => onChange('company', event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  />
                </FormField>
                <FormField label="Requested service">
                  <select
                    value={form.requested_service}
                    onChange={(event) => onChange('requested_service', event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  >
                    <option value="lead-desk">Lead Desk</option>
                    <option value="smart-site">Smart Site</option>
                    <option value="general-inquiry">General Inquiry</option>
                  </select>
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Budget band">
                  <input
                    value={form.budget_band}
                    onChange={(event) => onChange('budget_band', event.target.value)}
                    placeholder="10k+ retainer"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  />
                </FormField>
                <FormField label="Timeline">
                  <input
                    value={form.timeline}
                    onChange={(event) => onChange('timeline', event.target.value)}
                    placeholder="ASAP this week"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  />
                </FormField>
              </div>

              <FormField label="Message">
                <textarea
                  value={form.message}
                  onChange={(event) => onChange('message', event.target.value)}
                  rows={6}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                />
              </FormField>

              {submitMessage ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                  {submitMessage}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Dispatch to Lead Desk
              </button>
            </form>
          </section>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-4 flex items-center gap-2">
                <Radio className="h-4 w-4 text-cyan-400" />
                <h2 className="font-mono text-sm uppercase tracking-[0.35em] text-cyan-400">Tenant context</h2>
              </div>
              <p className="text-lg font-bold text-white">
                {payload?.manifest?.business?.public_name ?? 'MAXX Demo Lead Desk'}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {payload?.manifest?.business?.summary ??
                  'The tenant manifest drives intake context, offers, and routing for the demo employee.'}
              </p>
              <div className="mt-4 space-y-3">
                {(payload?.manifest?.business?.offers ?? []).map((offer) => (
                  <div key={offer.label} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-sm font-medium text-white">{offer.label}</p>
                    <p className="mt-1 text-sm text-white/60">{offer.outcome}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-4 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-cyan-400" />
                <h2 className="font-mono text-sm uppercase tracking-[0.35em] text-cyan-400">Operator queue</h2>
              </div>

              {loading ? (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-white/65">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  Loading Lead Desk queue...
                </div>
              ) : tasks.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-white/65">
                  No Lead Desk tasks yet. Submit the first inquiry to seed the operator queue.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.task_id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-2.5 w-2.5 rounded-full ${tierDot(task.qualification.tier)}`} />
                          <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">
                            {task.task_id}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <StatusBadge status={task.status} />
                          <TierBadge tier={task.qualification.tier} />
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-white/80">{task.operator_summary}</p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <MiniCard label="Score" value={`${task.qualification.score}`} />
                        <MiniCard label="Route" value={task.route_target} />
                        <MiniCard label="Dispatch" value={task.hermes_dispatch.status} />
                      </div>

                      <div className="mt-4 rounded-2xl border border-white/10 bg-[#050810] px-4 py-3">
                        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                          Follow-up actions
                        </p>
                        <div className="mt-3 space-y-2">
                          {task.follow_up_actions.map((action) => (
                            <div key={action} className="flex items-start gap-2 text-sm text-white/65">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {!task.hermes_dispatch.configured ? (
                        <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />
                            <span>{task.hermes_dispatch.notes[0] ?? 'Provider configuration is still missing.'}</span>
                          </div>
                        </div>
                      ) : task.hermes_dispatch.response_excerpt ? (
                        <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">
                            <UserRound className="h-3.5 w-3.5" />
                            Hermes output
                          </div>
                          {task.hermes_dispatch.response_excerpt}
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={updatingTaskId === task.task_id || task.status === 'completed'}
                          onClick={() => void updateTask(task.task_id, 'follow-up')}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:border-cyan-400/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {updatingTaskId === task.task_id ? 'Updating' : 'Mark follow-up'}
                        </button>
                        <button
                          type="button"
                          disabled={updatingTaskId === task.task_id || task.status === 'completed'}
                          onClick={() => void updateTask(task.task_id, 'completed')}
                          className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Complete task
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-2 text-sm text-white/80">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    queued: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200',
    blocked: 'border-red-400/20 bg-red-400/10 text-red-300',
    attention: 'border-orange-400/20 bg-orange-400/10 text-orange-200',
    triaged: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
  }

  return (
    <span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${styles[status] ?? 'border-white/10 bg-white/5 text-white/60'}`}>
      {status}
    </span>
  )
}

function TierBadge({ tier }: { tier: 'hot' | 'warm' | 'cold' }) {
  const styles: Record<string, string> = {
    hot: 'border-red-400/20 bg-red-400/10 text-red-300',
    warm: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200',
    cold: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
  }

  return (
    <span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${styles[tier]}`}>
      {tier}
    </span>
  )
}

function tierDot(tier: 'hot' | 'warm' | 'cold') {
  if (tier === 'hot') return 'bg-red-400'
  if (tier === 'warm') return 'bg-yellow-400'
  return 'bg-cyan-400'
}
