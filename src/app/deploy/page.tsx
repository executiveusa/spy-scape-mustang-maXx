import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  Command,
  ExternalLink,
  Globe,
  PlayCircle,
  Radio,
  Shield,
  Square,
  Terminal,
  Workflow,
  Wrench,
} from 'lucide-react'
import { fetchMaxxBffJson } from '@/lib/maxxBffServer'
import OperatorNav from '@/components/operator/OperatorNav'

export const dynamic = 'force-dynamic'

type DeployState = {
  mode: string
  status: string
  frontend_url: string
  dashboard_url: string
  backend_url: string
  launcher: {
    start: string
    stop: string
    script: string
  }
  vercel?: {
    project_id: string
    project_name: string
    team: string
    preview_url: string
    inspect_url: string
    status: string
  }
  steps: string[]
  blockers: string[]
}

const fallbackState: DeployState = {
  mode: 'local-stack',
  status: 'fallback',
  frontend_url: 'http://127.0.0.1:3011',
  dashboard_url: 'http://127.0.0.1:3011/dashboard',
  backend_url: 'http://127.0.0.1:8010',
  launcher: {
    start: 'start-local-stack.bat',
    stop: 'stop-local-stack.bat',
    script: 'scripts/start-local-stack.ps1',
  },
  vercel: {
    project_id: 'prj_i5FPLcORy8KYstJSDM2SdguJDNVr',
    project_name: 'spy-scape-mustang-maxx',
    team: 'the-pauli-effect',
    preview_url: 'https://spy-scape-mustang-maxx-ncl58dyko-the-pauli-effect.vercel.app',
    inspect_url: 'https://vercel.com/the-pauli-effect/spy-scape-mustang-maxx/JCcG4EDm1re5NLAcWkyzPT9SsQ2f',
    status: 'preview-ready',
  },
  steps: [
    'Run start-local-stack.bat from the repo root.',
    'Open the frontend or command deck on port 3011.',
    'Check backend reachability on port 8010.',
  ],
  blockers: [
    'Backend link is unavailable, so this page is using fallback deployment data.',
    'App-level auth is deferred; the BFF must stay private.',
    'Agent MAXX runtime path and provider credentials must be verified before model-backed execution is claimed.',
    'Final MAXX-owned art is still placeholder-driven.',
  ],
}

async function loadDeployState(): Promise<{ deployState: DeployState; backendOnline: boolean }> {
  try {
    const response = await fetchMaxxBffJson<DeployState>('/v1/deploy')
    return { deployState: response.data, backendOnline: response.backendOnline }
  } catch {
    return {
      deployState: fallbackState,
      backendOnline: false,
    }
  }
}

export default async function DeployPage() {
  const { deployState, backendOnline } = await loadDeployState()
  const productionGates = [
    {
      label: 'Private backend origin',
      detail: 'FastAPI must be reachable only through the named private/proxy path, with direct 8010 and 8020 ports closed before real client data.',
      ready: deployState.blockers.every((blocker) => !blocker.toLowerCase().includes('private')),
    },
    {
      label: 'Environment parity',
      detail: 'Vercel and VPS/Coolify must share MAXX_BFF_URL, MAXX_BFF_SHARED_SECRET, operator auth, runtime path, and allowed origins.',
      ready: backendOnline,
    },
    {
      label: 'Token rotation',
      detail: 'Rotate setup-era OpenRouter, Coolify, Vercel, Firecrawl, browser-worker, operator, and BFF secrets before real clients.',
      ready: false,
    },
    {
      label: 'Runtime execution',
      detail: 'Strict verification must prove /v1/maxx/runtime/health reports execution_ready=true for model-backed Lead Desk work.',
      ready: !deployState.blockers.some((blocker) => blocker.toLowerCase().includes('runtime')),
    },
    {
      label: 'Lead Desk round trip',
      detail: 'Verification must create a tenant, provision MAXX, submit an inquiry, complete a task, and confirm heartbeat state.',
      ready: backendOnline,
    },
    {
      label: 'Lead Acquisition canary',
      detail: 'Verification must run an owner-approved canary prospect and promote it into Lead Desk without autonomous browsing.',
      ready: backendOnline,
    },
    {
      label: 'Visual inspection',
      detail: 'Run npm run verify:visual against the live frontend after every operator UI, route, proxy, or deployment change.',
      ready: false,
    },
  ]

  return (
    <main className="min-h-screen bg-[#050810] text-white">
      <OperatorNav />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-10 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_80px_rgba(0,0,0,0.25)]">
          <div className="mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.35em] text-cyan-400/80">
            <Shield className="h-4 w-4" />
            Deployment Console
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="max-w-2xl text-4xl font-black uppercase tracking-[0.08em] text-white sm:text-5xl">
                Local MAXX stack, launcher-backed and route-verified
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                This is the operator-facing deployment surface for the current local stack. It tracks the
                launcher path, endpoint map, and the blockers that still keep this build below production grade.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-400/20"
              >
                <Workflow className="h-4 w-4" />
                Command Deck
              </Link>
              <Link
                href="/assets"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-cyan-400/40 hover:text-white"
              >
                <Wrench className="h-4 w-4" />
                Asset Pipeline
              </Link>
            </div>
          </div>
        </header>

        <section className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center justify-between">
              <Radio className="h-5 w-5 text-cyan-400" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/45">BFF link</span>
            </div>
            <div className="text-3xl font-black">{backendOnline ? 'online' : 'fallback'}</div>
            <p className="mt-2 text-sm text-white/65">Deployment payload source for this route.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center justify-between">
              <Command className="h-5 w-5 text-cyan-400" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/45">Mode</span>
            </div>
            <div className="text-3xl font-black">{deployState.mode}</div>
            <p className="mt-2 text-sm text-white/65">Current stack boot strategy surfaced by the BFF.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center justify-between">
              <PlayCircle className="h-5 w-5 text-cyan-400" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/45">Start</span>
            </div>
            <div className="truncate text-2xl font-black">{deployState.launcher.start}</div>
            <p className="mt-2 text-sm text-white/65">One-command local launcher used for verification.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center justify-between">
              <Square className="h-5 w-5 text-cyan-400" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/45">Stop</span>
            </div>
            <div className="truncate text-2xl font-black">{deployState.launcher.stop}</div>
            <p className="mt-2 text-sm text-white/65">Current shutdown path for the verified local listeners.</p>
          </div>
        </section>

        <section className="mb-10 rounded-[28px] border border-amber-300/15 bg-[linear-gradient(135deg,rgba(251,191,36,0.1),rgba(255,255,255,0.025))] p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-amber-100/70">
                Production closeout gates
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-white">
                what must be true before real client launch
              </h2>
            </div>
            <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-white/58">
              {productionGates.filter((gate) => gate.ready).length}/{productionGates.length} reporting ready
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {productionGates.map((gate) => (
              <div
                key={gate.label}
                className={`rounded-2xl border p-4 ${
                  gate.ready
                    ? 'border-emerald-400/20 bg-emerald-400/10'
                    : 'border-white/10 bg-black/20'
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  {gate.ready ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-300" />
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/38">
                    {gate.ready ? 'ready' : 'manual gate'}
                  </span>
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-white">{gate.label}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">{gate.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-5">
              <h2 className="font-mono text-sm uppercase tracking-[0.35em] text-cyan-400">Endpoint map</h2>
              <p className="mt-2 text-sm text-white/60">Verified local entrypoints for the current MAXX stack.</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Public Frontend', href: deployState.frontend_url, icon: Globe },
                { label: 'Command Deck', href: deployState.dashboard_url, icon: Workflow },
                { label: 'MAXX BFF', href: deployState.backend_url, icon: Radio },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:border-cyan-400/35"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="font-mono text-xs text-white/45">{item.href}</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-white/45" />
                </a>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">Launcher script</span>
              </div>
              <code className="block rounded-xl bg-[#050810] px-4 py-3 font-mono text-sm text-white/80">
                {deployState.launcher.script}
              </code>
            </div>

            {deployState.vercel ? (
              <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-cyan-400" />
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">Vercel preview</span>
                </div>
                <div className="space-y-3 text-sm text-white/75">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/45">Project</p>
                    <p className="mt-1 text-white">{deployState.vercel.project_name}</p>
                    <p className="font-mono text-xs text-white/45">{deployState.vercel.project_id}</p>
                  </div>
                  <a
                    href={deployState.vercel.preview_url}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-cyan-400/35"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">Preview deployment</p>
                      <p className="font-mono text-xs text-white/45">{deployState.vercel.preview_url}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-white/45" />
                  </a>
                  <a
                    href={deployState.vercel.inspect_url}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-cyan-400/35"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">Inspect deployment</p>
                      <p className="font-mono text-xs text-white/45">{deployState.vercel.status}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-white/45" />
                  </a>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <h2 className="font-mono text-sm uppercase tracking-[0.35em] text-cyan-400">Startup sequence</h2>
              <div className="mt-4 space-y-3">
                {deployState.steps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 font-mono text-xs text-cyan-300">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-white/75">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <h2 className="font-mono text-sm uppercase tracking-[0.35em] text-cyan-400">Current blockers</h2>
              </div>
              <div className="space-y-3">
                {deployState.blockers.map((blocker) => (
                  <div key={blocker} className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                    <p className="text-sm leading-6 text-white/75">{blocker}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h2 className="font-mono text-sm uppercase tracking-[0.35em] text-cyan-400">Route status</h2>
              </div>
              <p className="text-sm leading-6 text-white/75">
                The deployment console is now rendered from the live backend contract when it is available.
                That keeps the first paint, the operator view, and the deployment metadata aligned instead of
                waiting on client-only hydration to tell the full story.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
