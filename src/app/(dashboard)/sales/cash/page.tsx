import { getCashSessions, getActiveCashSession, getCashSessionBreakdown } from '@/modules/sales/actions/sales'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModuleGuard } from '@/components/layout/module-guard'
import { CashSessionClient } from './cash-session-client'

export default async function CashPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

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

