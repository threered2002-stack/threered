import { getCashSessions, getActiveCashSession, getCashSessionBreakdown } from '@/modules/sales/actions/sales'
import { getActiveMembership } from '@/modules/core/actions/organizations'
import { redirect } from 'next/navigation'
import { ModuleGuard } from '@/components/layout/module-guard'
import { CashSessionClient } from './cash-session-client'

export default async function CashPage() {
  const membership = await getActiveMembership()
  if (!membership) redirect('/org/new')

  const orgId = membership.organization_id

  const [sessions, openSession, currentBreakdown] = await Promise.all([
    getCashSessions(orgId),
    getActiveCashSession(orgId),
    getCashSessionBreakdown(orgId)
  ])

  return (
    <ModuleGuard module="sales">
      <CashSessionClient 
        orgId={orgId}
        openSession={openSession}
        sessions={sessions || []}
        currentBreakdown={currentBreakdown}
      />
    </ModuleGuard>
  )
}

