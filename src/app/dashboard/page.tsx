'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  Eye,
  Loader2,
  Lock,
  Radio,
  RefreshCw,
  Radar,
  Server,
  Target,
  UserRound,
  Wifi,
  XCircle,
} from 'lucide-react'
import OperatorNav from '@/components/operator/OperatorNav'

type SystemStatus = 'online' | 'warning' | 'offline'

type RuntimeSystem = {
  name: string
  status: SystemStatus
  latency: string
  detail: string
}

type RuntimeNote = {
  id: string
  timestamp: string
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
}

type RuntimeRoute = {
  path: string
  label: string
  status: 'live' | 'planned' | 'offline'
}

type AgUiEvent = {
  type: string
  event_id: string
  run_id: string
  timestamp: string
  payload: Record<string, unknown>
}

type RuntimePayload = {
  status?: string
  mode?: string
  frontend?: string
  systems?: RuntimeSystem[]
  logs?: RuntimeNote[]
  routes?: RuntimeRoute[]
  clients?: Array<{ client_id: string; status: string }>
  workflow_packs?: Array<{ workflow_id: string; status: string }>
  heartbeats?: Array<{ workflow_id: string; status: string; summary: string; pending_task_ids: string[] }>
  maxx_runtime?: {
    status?: string
    execution_ready?: boolean
    provider_configured?: boolean
    profiles_total?: number
    provider?: string
    model?: string
  }
  ag_ui?: {
    protocol?: string
    transport?: string
    events?: AgUiEvent[]
  } | null
  operator_console?: {
    backend_origin?: string
    network_posture?: 'controlled-demo' | 'private-ready'
    real_client_ready?: boolean
    shared_secret_configured?: boolean
    operator_message?: string
    next_action?: string
  }
}

type DashboardTab = 'overview' | 'systems' | 'events'

const statusClasses: Record<string, string> = {
  online: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
  warning: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
  offline: 'text-red-300 bg-red-400/10 border-red-400/20',
  live: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
  planned: 'text-slate-300 bg-slate-400/10 border-slate-400/20',
  ready: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
  degraded: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
}

const eventLabels: Record<string, string> = {
  MAXX_RUNTIME_STATE: 'Runtime',
  MAXX_TASK_STATE: 'Lead Desk',
  MAXX_PROSPECT_STATE: 'Prospect',
  MAXX_JOB_STATE: 'Acquisition Job',
  MAXX_HEARTBEAT_STATE: 'Heartbeat',
}

export default function DashboardPage() {
  const [payload, setPayload] = useState<RuntimePayload | null>(null)
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRuntime = async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const response = await fetch('/api/runtime/', { cache: 'no-store' })
      const nextPayload = (await response.json()) as RuntimePayload & { detail?: string }
      if (!response.ok) {
        throw new Error(nextPayload.detail ?? 'Agent MAXX runtime failed to load.')
      }
      setPayload(nextPayload)
    } catch (runtimeError) {
      setError(runtimeError instanceof Error ? runtimeError.message : 'Agent MAXX runtime failed to load.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadRuntime()
  }, [])

  const systems = payload?.systems ?? []
  const logs = payload?.logs ?? []
  const routes = payload?.routes ?? []
  const events = payload?.ag_ui?.events ?? []
  const onlineSystems = systems.filter((system) => system.status === 'online').length
  const liveRoutes = routes.filter((route) => route.status === 'live').length
  const activeHeartbeats = payload?.heartbeats?.filter((heartbeat) => heartbeat.status !== 'clear') ?? []
  const taskEvents = useMemo(() => events.filter((event) => event.type === 'MAXX_TASK_STATE'), [events])
  const prospectEvents = useMemo(() => events.filter((event) => event.type === 'MAXX_PROSPECT_STATE'), [events])

  return (
    <main className="min-h-screen overflow-hidden bg-[#050810] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(70,213,255,0.16),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(244,211,94,0.09),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.035)_0,transparent_30%)]" />

      <OperatorNav />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => void loadRuntime('refresh')}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-cyan-300/40 hover:text-cyan-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh runtime
          </button>
        </div>
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-white/10 bg-white/[0.04] p-7 shadow-2xl shadow-cyan-950/20">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <StatusBadge value={payload?.status ?? (loading ? 'loading' : 'degraded')} />
              <span className="font-mono text-xs uppercase tracking-[0.28em] text-white/45">
                {payload?.frontend ?? 'Runtime bridge'}
              </span>
            </div>
            <h1 className="max-w-4xl text-4xl font-black uppercase tracking-[0.08em] sm:text-6xl">
              see what MAXX is doing, not what the demo claims
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
              This command deck is now wired to the real backend. It reads the MAXX control plane,
              AG-UI event bridge, Lead Desk queue, Lead Acquisition evidence, and heartbeat summaries.
            </p>
            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-[32px] border border-cyan-300/15 bg-cyan-300/[0.055] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200/70">Runtime Readiness</div>
                <div className="mt-2 text-2xl font-black uppercase">
                  {payload?.maxx_runtime?.execution_ready ? 'Model-backed' : 'Controlled demo'}
                </div>
              </div>
              <Radio className="h-8 w-8 text-cyan-200" />
            </div>
            <div className="space-y-3">
              <ReadinessRow label="Provider" value={payload?.maxx_runtime?.provider ?? 'unknown'} />
              <ReadinessRow label="Model" value={payload?.maxx_runtime?.model ?? 'unknown'} />
              <ReadinessRow label="Profiles" value={`${payload?.maxx_runtime?.profiles_total ?? 0}`} />
              <ReadinessRow label="AG-UI" value={payload?.ag_ui?.protocol ? `${payload.ag_ui.protocol} / ${payload.ag_ui.transport}` : 'not loaded'} />
            </div>
          </motion.div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-8 rounded-[30px] border border-amber-300/15 bg-[linear-gradient(135deg,rgba(251,191,36,0.11),rgba(8,14,26,0.82))] p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <Server className="h-5 w-5 text-amber-200" />
                <span className="font-mono text-xs uppercase tracking-[0.28em] text-amber-100/70">Backend Command Console</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-[0.08em]">
                {payload?.operator_console?.real_client_ready ? 'private launch posture' : 'controlled demo posture'}
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <ReadinessRow label="Network" value={payload?.operator_console?.network_posture ?? 'checking'} />
              <ReadinessRow label="Origin" value={payload?.operator_console?.backend_origin ?? 'unknown'} />
              <ReadinessRow label="Secret Gate" value={payload?.operator_console?.shared_secret_configured ? 'configured' : 'missing'} />
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/72">
              {payload?.operator_console?.operator_message ?? 'Agent MAXX is checking backend posture.'}
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-cyan-100">
              <span className="font-semibold text-white">Next action:</span> {payload?.operator_console?.next_action ?? 'Refresh runtime state.'}
            </div>
          </div>
        </motion.section>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <MetricCard icon={Wifi} label="Systems Online" value={`${onlineSystems}/${systems.length || 0}`} detail="Live BFF runtime systems." />
          <MetricCard icon={Target} label="Lead Tasks" value={`${taskEvents.length}`} detail="AG-UI task state events." />
          <MetricCard icon={Radar} label="Prospects" value={`${prospectEvents.length}`} detail="Acquisition evidence events." />
          <MetricCard icon={Clock3} label="Watchdogs" value={`${activeHeartbeats.length}`} detail="Active heartbeat summaries." />
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[32px] border border-white/10 bg-white/[0.03]">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2">
              {(['overview', 'systems', 'events'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-5 py-2 font-mono text-xs uppercase tracking-[0.22em] transition ${
                    activeTab === tab ? 'bg-cyan-300 text-black' : 'text-white/55 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <Panel title="Mission Routes" icon={Database} action={`${liveRoutes}/${routes.length} live`}>
                  <div className="space-y-3">
                    {routes.slice(0, 8).map((route) => (
                      <div key={route.path} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-white">{route.label}</div>
                          <div className="font-mono text-xs text-white/40">{route.path}</div>
                        </div>
                        <StatusBadge value={route.status} />
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel title="Recent Operator Signals" icon={Activity} action={`${logs.length} notes`}>
                  <div className="space-y-3">
                    {logs.slice(0, 8).map((log) => (
                      <div key={log.id} className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <LogIcon type={log.type} />
                        <div>
                          <div className="text-sm leading-6 text-white/80">{log.message}</div>
                          <div className="mt-1 font-mono text-xs text-white/35">{log.timestamp}</div>
                        </div>
                      </div>
                    ))}
                    {logs.length === 0 && <EmptyState message="No runtime notes yet. Submit a Lead Desk inquiry to generate one." />}
                  </div>
                </Panel>
              </div>
            )}

            {activeTab === 'systems' && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {systems.map((system) => (
                  <div key={system.name} className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <StatusBadge value={system.status} />
                      <span className="font-mono text-xs text-white/45">{system.latency}</span>
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-[0.08em]">{system.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/62">{system.detail}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'events' && (
              <Panel title="AG-UI Event Feed" icon={Eye} action={`${events.length} events`}>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.event_id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge value={eventLabels[event.type] ?? event.type} />
                          <span className="font-mono text-xs text-white/40">{event.run_id}</span>
                        </div>
                        <span className="font-mono text-xs text-white/35">{event.timestamp}</span>
                      </div>
                      <p className="text-sm leading-6 text-white/72">{eventSummary(event)}</p>
                    </div>
                  ))}
                  {events.length === 0 && <EmptyState message="AG-UI bridge is connected, but no events are available yet." />}
                </div>
              </Panel>
            )}
          </>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          <ActionLink href="/lead-desk" label="Lead Desk" icon={UserRound} />
          <ActionLink href="/lead-acquisition" label="Lead Acquisition" icon={Radar} />
          <ActionLink href="/tenants" label="Tenants" icon={Lock} />
          <ActionLink href="/deploy" label="Deploy Readiness" icon={ArrowRight} />
        </div>
      </section>
    </main>
  )
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: typeof Activity; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-4 flex items-center justify-between">
        <Icon className="h-5 w-5 text-cyan-300" />
        <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(70,213,255,0.75)]" />
      </div>
      <div className="text-3xl font-black uppercase tracking-[0.08em]">{value}</div>
      <div className="mt-1 font-mono text-xs uppercase tracking-[0.22em] text-white/45">{label}</div>
      <p className="mt-3 text-sm leading-6 text-white/58">{detail}</p>
    </div>
  )
}

function Panel({ title, icon: Icon, action, children }: { title: string; icon: typeof Activity; action: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 text-cyan-300" />
          <h2 className="font-mono text-sm uppercase tracking-[0.28em] text-cyan-200">{title}</h2>
        </div>
        <span className="font-mono text-xs text-white/38">{action}</span>
      </div>
      {children}
    </section>
  )
}

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase()
  return (
    <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${statusClasses[normalized] ?? 'border-white/10 bg-white/5 text-white/60'}`}>
      {value}
    </span>
  )
}

function ReadinessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-sm text-white/58">{label}</span>
      <span className="max-w-[220px] truncate text-right font-mono text-xs text-white/86">{value}</span>
    </div>
  )
}

function LogIcon({ type }: { type: RuntimeNote['type'] }) {
  if (type === 'success') return <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-300" />
  if (type === 'warning') return <AlertTriangle className="mt-1 h-4 w-4 flex-shrink-0 text-amber-300" />
  if (type === 'error') return <XCircle className="mt-1 h-4 w-4 flex-shrink-0 text-red-300" />
  return <Activity className="mt-1 h-4 w-4 flex-shrink-0 text-cyan-300" />
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 text-sm text-white/45">
      {message}
    </div>
  )
}

function ActionLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Activity }) {
  return (
    <Link href={href} className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 transition hover:border-cyan-300/35 hover:bg-cyan-300/10">
      <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-white/72 group-hover:text-white">
        <Icon className="h-4 w-4 text-cyan-300" />
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-white/30 transition group-hover:translate-x-1 group-hover:text-cyan-200" />
    </Link>
  )
}

function eventSummary(event: AgUiEvent) {
  const payload = event.payload
  if (event.type === 'MAXX_TASK_STATE') {
    return `${String(payload.task_id ?? 'Task')} is ${String(payload.status ?? 'unknown')} with next action ${String(payload.next_action ?? 'review')}.`
  }
  if (event.type === 'MAXX_PROSPECT_STATE') {
    return `${String(payload.company ?? 'Prospect')} is ${String(payload.status ?? 'unknown')} at score ${String(payload.score ?? 'n/a')} (${String(payload.confidence ?? 'unknown')}).`
  }
  if (event.type === 'MAXX_JOB_STATE') {
    return `${String(payload.source ?? 'Source')} job ${String(payload.job_id ?? '')} is ${String(payload.status ?? 'unknown')} with ${String(payload.discovered_count ?? 0)} discovered.`
  }
  if (event.type === 'MAXX_HEARTBEAT_STATE') {
    return `${String(payload.workflow_id ?? 'Workflow')} heartbeat is ${String(payload.status ?? 'unknown')}: ${String(payload.summary ?? '')}`
  }
  if (event.type === 'MAXX_RUNTIME_STATE') {
    const runtime = payload.runtime as { status?: string; execution_ready?: boolean } | undefined
    return `Agent MAXX runtime is ${runtime?.status ?? 'unknown'}; execution ready is ${runtime?.execution_ready ? 'true' : 'false'}.`
  }
  return event.type
}
