import { Activity, ClipboardList, Eye, Route, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type PublicFeatureSource =
  | 'workflow_packs'
  | 'operator_oversight'
  | 'smart_site_manifest'
  | 'lead_desk_tasks'
  | 'guardrails'

export type PublicFeatureState = 'live' | 'degraded' | 'standby'

export type PublicFeature = {
  label: string
  internal_name: string
  source: PublicFeatureSource
  title: string
  description: string
  status: PublicFeatureState
  evidence: string
  Icon: LucideIcon
}

export const publicFeatureContracts: Array<Omit<PublicFeature, 'status' | 'evidence'>> = [
  {
    label: 'Q Branch',
    internal_name: 'workflow_packs',
    source: 'workflow_packs',
    title: 'Workflow Packs And Tool Registry',
    description: 'The customer-facing tool room is backed by enabled workflow packs, starting with Lead Desk.',
    Icon: Activity,
  },
  {
    label: 'MI6 Desk',
    internal_name: 'operator_oversight',
    source: 'operator_oversight',
    title: 'Operator Oversight',
    description: 'The mission-control desk reflects protected task review and operator routing surfaces.',
    Icon: ClipboardList,
  },
  {
    label: 'GoldenEye',
    internal_name: 'smart_site_manifest',
    source: 'smart_site_manifest',
    title: 'Smart-Site Business Intelligence',
    description: 'The business identity, offers, channels, and routing rules come from the tenant manifest.',
    Icon: Eye,
  },
  {
    label: 'Aston Grid',
    internal_name: 'lead_desk_tasks',
    source: 'lead_desk_tasks',
    title: 'Routing And Follow-Up Flow',
    description: 'Lead Desk task state exposes intake, route, next action, and follow-up status.',
    Icon: Route,
  },
  {
    label: 'Spectre Shield',
    internal_name: 'guardrails',
    source: 'guardrails',
    title: 'Validation And Degraded-State Handling',
    description: 'Auth gates, shared-secret BFF access, and explicit degraded states keep the demo safe.',
    Icon: ShieldCheck,
  },
]

export function featureState(isLive: boolean, fallback: PublicFeatureState = 'degraded'): PublicFeatureState {
  return isLive ? 'live' : fallback
}
