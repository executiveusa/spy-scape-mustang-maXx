import { AlertTriangle, CheckCircle2, FileText, UserRound } from 'lucide-react'

export type LeadTaskStatus = 'triaged' | 'queued' | 'attention' | 'follow-up' | 'completed' | 'blocked'

export type LeadDeskTask = {
  task_id: string
  status: LeadTaskStatus
  client_id: string
  route_target: string
  routing_target: string
  operator_summary: string
  next_action: string
  created_at: string
  updated_at?: string
  submission: {
    contact_name: string
    company?: string | null
    email?: string | null
    phone?: string | null
    message: string
    requested_service: string
    budget_band?: string | null
    timeline?: string | null
    preferred_channel: string
    source: string
  }
  qualification: {
    tier: 'hot' | 'warm' | 'cold'
    score: number
    confidence?: string
    reasons?: string[]
    next_action: string
  }
  maxx_dispatch: {
    status: string
    provider: string
    model: string
    configured: boolean
    notes: string[]
    response_excerpt?: string | null
  }
  follow_up_actions: string[]
  heartbeat_summary: {
    status: string
    next_due_at: string
    summary: string
    pending_task_ids: string[]
  }
  workspace_files?: string[]
}

export type LeadDeskOperatorStatus = Extract<LeadTaskStatus, 'attention' | 'follow-up' | 'completed'>

export default function LeadDeskReviewPanel({
  task,
  updating,
  onUpdate,
}: {
  task: LeadDeskTask
  updating: boolean
  onUpdate: (taskId: string, status: LeadDeskOperatorStatus) => void
}) {
  const capturedRows = [
    ['Contact', task.submission.contact_name],
    ['Company', task.submission.company || 'not provided'],
    ['Email', task.submission.email || 'not provided'],
    ['Phone', task.submission.phone || 'not provided'],
    ['Service', task.submission.requested_service],
    ['Timeline', task.submission.timeline || 'not provided'],
    ['Budget', task.submission.budget_band || 'not provided'],
    ['Channel', task.submission.preferred_channel],
  ]

  const disabled = updating || task.status === 'completed'

  return (
    <article className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${tierDot(task.qualification.tier)}`} />
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">{task.task_id}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={task.status} />
          <TierBadge tier={task.qualification.tier} />
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/80">{task.operator_summary}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <MiniCard label="Score" value={`${task.qualification.score}/100`} />
        <MiniCard label="Route" value={task.routing_target ?? task.route_target} />
        <MiniCard label="Next" value={task.next_action} />
        <MiniCard label="Dispatch" value={task.maxx_dispatch.status} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-white/10 bg-[#050810] px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">What MAXX captured</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {capturedRows.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">{label}</p>
                <p className="mt-1 break-words text-sm text-white/76">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white/62">
            {task.submission.message}
          </p>
        </section>

        <section className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">Why MAXX scored it</p>
          <div className="mt-3 space-y-2">
            {(task.qualification.reasons?.length ? task.qualification.reasons : ['Captured for operator review.']).map((reason) => (
              <div key={reason} className="flex items-start gap-2 text-sm text-white/65">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniCard label="Confidence" value={task.qualification.confidence ?? 'medium'} />
            <MiniCard label="Source" value={task.submission.source} />
          </div>
        </section>
      </div>

      <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">
            Heartbeat {task.heartbeat_summary.status}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            {task.heartbeat_summary.pending_task_ids.length} pending
          </p>
        </div>
        <p className="mt-2 text-sm text-white/65">{task.heartbeat_summary.summary}</p>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#050810] px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Follow-up actions</p>
        <div className="mt-3 space-y-2">
          {task.follow_up_actions.map((action) => (
            <div key={action} className="flex items-start gap-2 text-sm text-white/65">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{action}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#050810] px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Workspace evidence</p>
        {task.workspace_files?.length ? (
          <div className="mt-3 space-y-2">
            {task.workspace_files.map((filePath) => (
              <div key={filePath} className="flex items-start gap-2 text-sm text-white/60">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <span className="break-all">{filePath}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-white/45">No workspace files were attached to this task yet.</p>
        )}
      </div>

      {!task.maxx_dispatch.configured ? (
        <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />
            <span>{task.maxx_dispatch.notes[0] ?? 'Provider configuration is still missing.'}</span>
          </div>
        </div>
      ) : task.maxx_dispatch.response_excerpt ? (
        <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">
            <UserRound className="h-3.5 w-3.5" />
            Agent MAXX output
          </div>
          {task.maxx_dispatch.response_excerpt}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton
          disabled={disabled || task.status === 'attention'}
          label={updating ? 'Updating' : 'Escalate attention'}
          onClick={() => onUpdate(task.task_id, 'attention')}
          tone="warning"
        />
        <ActionButton
          disabled={disabled || task.status === 'follow-up'}
          label={updating ? 'Updating' : 'Start follow-up'}
          onClick={() => onUpdate(task.task_id, 'follow-up')}
          tone="neutral"
        />
        <ActionButton
          disabled={disabled}
          label={updating ? 'Updating' : 'Complete task'}
          onClick={() => onUpdate(task.task_id, 'completed')}
          tone="success"
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
  tone: 'neutral' | 'success' | 'warning'
}) {
  const styles = {
    neutral: 'border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/30 hover:text-white',
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20',
    warning: 'border-orange-400/20 bg-orange-400/10 text-orange-200 hover:bg-orange-400/20',
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-40 ${styles[tone]}`}
    >
      {label}
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
    completed: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    queued: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200',
    blocked: 'border-red-400/20 bg-red-400/10 text-red-300',
    attention: 'border-orange-400/20 bg-orange-400/10 text-orange-200',
    triaged: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
    'follow-up': 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
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
