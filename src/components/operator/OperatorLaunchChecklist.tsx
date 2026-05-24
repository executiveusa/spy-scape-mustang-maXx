import Link from 'next/link'
import { ArrowRight, CheckCircle2, CircleDashed, Clock3, XCircle } from 'lucide-react'

export type LaunchStepStatus = 'complete' | 'current' | 'pending' | 'blocked'

export type LaunchStep = {
  label: string
  detail: string
  status: LaunchStepStatus
  href?: string
}

const statusStyles: Record<LaunchStepStatus, string> = {
  complete: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  current: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-200',
  pending: 'border-white/10 bg-white/[0.035] text-white/58',
  blocked: 'border-red-400/25 bg-red-400/10 text-red-200',
}

function StatusIcon({ status }: { status: LaunchStepStatus }) {
  if (status === 'complete') return <CheckCircle2 className="h-4 w-4 text-emerald-300" />
  if (status === 'current') return <Clock3 className="h-4 w-4 text-cyan-300" />
  if (status === 'blocked') return <XCircle className="h-4 w-4 text-red-300" />
  return <CircleDashed className="h-4 w-4 text-white/35" />
}

export default function OperatorLaunchChecklist({
  title = 'New client in 15 minutes',
  eyebrow = 'Operator launch path',
  steps,
}: {
  title?: string
  eyebrow?: string
  steps: LaunchStep[]
}) {
  const complete = steps.filter((step) => step.status === 'complete').length

  return (
    <section className="rounded-[30px] border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(70,213,255,0.09),rgba(255,255,255,0.025))] p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200/70">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-white">{title}</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-white/58">
          {complete}/{steps.length} ready
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {steps.map((step, index) => {
          const card = (
            <div className={`h-full rounded-2xl border p-4 transition ${statusStyles[step.status]} ${step.href ? 'hover:border-cyan-300/45 hover:bg-cyan-300/12' : ''}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <StatusIcon status={step.status} />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
                  Step {index + 1}
                </span>
              </div>
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-white">{step.label}</p>
              <p className="mt-2 text-sm leading-6 opacity-80">{step.detail}</p>
              {step.href ? (
                <span className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-100">
                  Open
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </div>
          )

          return step.href ? (
            <Link key={step.label} href={step.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={step.label}>{card}</div>
          )
        })}
      </div>
    </section>
  )
}

