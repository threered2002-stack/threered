import { getAccounts } from '@/modules/finance/actions/finance'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, CreditCard, Landmark, Wallet, MoreVertical } from 'lucide-react'
import { ModuleGuard } from '@/components/layout/module-guard'

export default async function AccountsPage() {
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

  const accounts = await getAccounts(membership.organization_id)

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(cents / 100)
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Landmark className="w-6 h-6" />
      case 'digital_wallet': return <CreditCard className="w-6 h-6" />
      default: return <Wallet className="w-6 h-6" />
    }
  }

  const getAccountTypeName = (type: string) => {
    switch (type) {
      case 'bank': return 'Banco'
      case 'digital_wallet': return 'Billetera Virtual'
      default: return 'Caja Fija'
    }
  }

  return (
    <ModuleGuard module="finance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-violet-400" />
              Cuentas
            </h1>
            <p className="text-neutral-400 mt-1">Gestioná tus cajas, bancos y billeteras virtuales.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20 w-fit">
            <Plus className="w-4 h-4" />
            Nueva Cuenta
          </button>
        </div>

        {/* Grid de cuentas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 relative group overflow-hidden hover:bg-neutral-900/80 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {getAccountIcon(acc.account_type)}
              </div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-violet-400 transition-colors">
                    {getAccountIcon(acc.account_type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{acc.name}</h3>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{getAccountTypeName(acc.account_type)}</p>
                  </div>
                </div>
                <button className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-400 mb-1">Saldo Actual</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(acc.balance_cents)}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800/80 flex gap-2">
                <Link
                  href={`/finance/transactions?account=${acc.id}`}
                  className="flex-1 text-center py-2 bg-neutral-800/50 hover:bg-neutral-800 text-sm font-medium text-neutral-300 rounded-lg transition-colors"
                >
                  Ver Movimientos
                </Link>
              </div>
            </div>
          ))}

          {/* Tarjeta para crear nueva cuenta */}
          <button className="bg-neutral-900/20 border-2 border-dashed border-neutral-800 hover:border-violet-500/50 hover:bg-violet-500/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px] transition-all group">
            <div className="w-12 h-12 rounded-full bg-neutral-800 group-hover:bg-violet-500/20 flex items-center justify-center mb-3 transition-colors">
              <Plus className="w-6 h-6 text-neutral-400 group-hover:text-violet-400" />
            </div>
            <p className="font-medium text-white">Agregar Cuenta</p>
            <p className="text-sm text-neutral-500 mt-1">Caja, Banco o Billetera</p>
          </button>
        </div>
      </div>
    </ModuleGuard>
  )
}
