import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2, ExternalLink, ShieldCheck, XCircle } from 'lucide-react'

export type AcquisitionEvidence = {
  evidence_id: string
  label: string
  url?: string | null
  excerpt: string
  captured_at: string
}

export type AcquisitionProspect = {
  prospect_id: string
  status: string
  source: string
  name?: string | null
  title?: string | null
  company: string
  email?: string | null
  email_status?: string | null
  phone?: string | null
  linkedin_url?: string | null
  organization_domain?: string | null
  location?: string | null
  seniority?: string | null
  department?: string | null
  score: number
  confidence: string
  reasons: string[]
  evidence: AcquisitionEvidence[]
  opt_out?: boolean
  do_not_contact?: boolean
  promoted_task_id?: string | null
}

export type AcquisitionAction = 'promote' | 'reject'

export default function LeadAcquisitionReviewPanel({
  prospect,
  workingId,
  onAction,
}: {
  prospect: AcquisitionProspect
  workingId: string | null
  onAction: (prospectId: string, action: AcquisitionAction) => void
}) {
  const complianceBlocked = Boolean(prospect.do_not_contact || prospect.opt_out)
  const promoted = Boolean(prospect.promoted_task_id || prospect.status === 'promoted')
  const rejected = prospect.status === 'rejected'
  const actionDisabled = complianceBlocked || promoted || rejected
  const rows = [
    ['Contact', prospect.name || 'contact pending'],
    ['Title', prospect.title || 'not provided'],
    ['Email', prospect.email || 'missing'],
    ['Phone', prospect.phone || 'missing'],
    ['Domain', prospect.organization_domain || 'missing'],
    ['Location', prospect.location || 'unknown'],
    ['Seniority', prospect.seniority || 'unknown'],
    ['Department', prospect.department || 'unknown'],
  ]

  return (
    <article className="rounded-3xl border border-white/10 bg-black/20 p-5">
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

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <MiniCard label="Confidence" value={prospect.confidence} />
        <MiniCard label="Source" value={prospect.source} />
        <MiniCard label="Email status" value={prospect.email_status ?? 'unknown'} />
        <MiniCard label="Contactable" value={complianceBlocked ? 'blocked' : prospect.email || prospect.phone ? 'yes' : 'needs review'} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-white/10 bg-[#050810] px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">Prospect profile</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">{label}</p>
                <p className="mt-1 break-words text-sm text-white/76">{value}</p>
              </div>
            ))}
          </div>
          {prospect.linkedin_url ? (
            <a
              href={prospect.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-200 transition hover:bg-cyan-400/20"
            >
              Profile link
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </section>

        <section className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">
            Why MAXX surfaced this prospect
          </p>
          <div className="mt-3 space-y-2">
            {prospect.reasons.map((reason) => (
              <div key={reason} className="flex items-start gap-2 text-sm text-white/65">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={`mt-4 rounded-2xl border px-4 py-3 ${complianceBlocked ? 'border-red-400/20 bg-red-400/10' : 'border-emerald-400/15 bg-emerald-400/[0.06]'}`}>
        <div className="flex items-start gap-2">
          {complianceBlocked ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
          ) : (
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          )}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">Compliance gate</p>
            <p className="mt-1 text-sm leading-6 text-white/62">
              {complianceBlocked
                ? 'Opt-out or do-not-contact evidence blocks promotion until an operator clears the record outside Agent MAXX.'
                : 'No opt-out or do-not-contact hold is present. Operator approval is still required before outreach.'}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-[#050810] px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Source evidence</p>
        <div className="mt-3 space-y-2">
          {prospect.evidence.map((item) => (
            <div key={item.evidence_id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">{item.label}</p>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">{item.captured_at}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/65">{item.excerpt}</p>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-200">
                  View source
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {prospect.promoted_task_id ? (
        <Link
          href="/lead-desk"
          className="mt-4 flex items-center justify-between rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100 transition hover:bg-cyan-400/20"
        >
          <span>
            <span className="font-semibold text-white">Promoted Lead Desk task:</span> {prospect.promoted_task_id}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton
          disabled={actionDisabled || workingId === `promote:${prospect.prospect_id}`}
          label={workingId === `promote:${prospect.prospect_id}` ? 'Promoting' : 'Promote to Lead Desk'}
          onClick={() => onAction(prospect.prospect_id, 'promote')}
          tone="success"
        />
        <ActionButton
          disabled={rejected || promoted || workingId === `reject:${prospect.prospect_id}`}
          label={workingId === `reject:${prospect.prospect_id}` ? 'Rejecting' : 'Reject before outreach'}
          onClick={() => onAction(prospect.prospect_id, 'reject')}
          tone="danger"
        />
      </div>
    </article>
  )
}

function ActionButton({
  disabled,
  label,
  onClick,
  tone,
}: {
  disabled: boolean
  label: string
  onClick: () => void
  tone: 'success' | 'danger'
}) {
  const styles = {
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20',
    danger: 'border-white/10 bg-white/5 text-white/70 hover:border-red-400/30 hover:text-white',
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-40 ${styles[tone]}`}
    >
      {tone === 'danger' ? (
        <span className="inline-flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5" />
          {label}
        </span>
      ) : (
        label
      )}
    </button>
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    qualified: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    promoted: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
    enriched: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200',
    'needs-review': 'border-orange-400/20 bg-orange-400/10 text-orange-200',
    rejected: 'border-red-400/20 bg-red-400/10 text-red-300',
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
