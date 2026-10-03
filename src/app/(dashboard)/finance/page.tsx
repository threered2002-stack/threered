import { getAccounts, getTransactions, getFinanceSummary } from '@/modules/finance/actions/finance'
import { getUserMembership } from '@/modules/core/actions/organizations'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ArrowUpRight, ArrowDownRight, Wallet, Landmark, CreditCard, Activity, PieChart } from 'lucide-react'
import { ModuleGuard } from '@/components/layout/module-guard'
import { FinancePieChart } from '@/components/finance/finance-charts'

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Necesitamos saber qué organización está activa para este usuario
  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) redirect('/org/new')

  const orgId = membership.organization_id

  const [accounts, summary, transactions] = await Promise.all([
    getAccounts(orgId),
    getFinanceSummary(orgId),
    getTransactions(orgId, 20) // Últimos 20 movimientos
  ])

  // Calcular totales sumando todas las cuentas
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance_cents, 0)
  const totalIncome = summary.reduce((acc, curr) => acc + curr.month_income_cents, 0)
  const totalExpense = summary.reduce((acc, curr) => acc + curr.month_expense_cents, 0)

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(cents / 100)
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Landmark className="w-5 h-5" />
      case 'digital_wallet': return <CreditCard className="w-5 h-5" />
      default: return <Wallet className="w-5 h-5" />
    }
  }

  return (
    <ModuleGuard module="finance">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Finanzas</h1>
            <p className="text-neutral-400 mt-1">Caja, ingresos, egresos y cuentas.</p>
          </div>
          <Link
            href="/finance/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20 w-fit"
          >
            <Plus className="w-5 h-5" />
            Nuevo Movimiento
          </Link>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-24 h-24" />
            </div>
            <p className="text-sm font-medium text-neutral-400">Saldo Total</p>
            <p className="text-3xl font-bold text-white mt-2">{formatCurrency(totalBalance)}</p>
            <p className="text-xs text-neutral-500 mt-2">En todas las cuentas</p>
          </div>
          
          <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
              <ArrowUpRight className="w-24 h-24" />
            </div>
            <p className="text-sm font-medium text-neutral-400">Ingresos del Mes</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{formatCurrency(totalIncome)}</p>
            <p className="text-xs text-neutral-500 mt-2">Desde el 1ro del mes</p>
          </div>

          <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-500">
              <ArrowDownRight className="w-24 h-24" />
            </div>
            <p className="text-sm font-medium text-neutral-400">Egresos del Mes</p>
            <p className="text-3xl font-bold text-rose-400 mt-2">{formatCurrency(totalExpense)}</p>
            <p className="text-xs text-neutral-500 mt-2">Desde el 1ro del mes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cuentas */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-violet-400" />
              Mis Cuentas
            </h2>
            <div className="space-y-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="p-4 bg-neutral-900/40 border border-neutral-800/80 rounded-xl hover:bg-neutral-900/60 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-violet-400 transition-colors">
                      {getAccountIcon(acc.account_type)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{acc.name}</p>
                      <p className="text-xs text-neutral-500 uppercase tracking-wider">{acc.account_type === 'cash' ? 'Caja Fija' : acc.account_type === 'bank' ? 'Banco' : 'Billetera Virtual'}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-white">{formatCurrency(acc.balance_cents)}</p>
                </div>
              ))}
              {accounts.length === 0 && (
                <div className="p-6 text-center border border-dashed border-neutral-800 rounded-xl">
                  <p className="text-sm text-neutral-500">No hay cuentas configuradas</p>
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Distribución */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-violet-400" />
              Distribución del Mes
            </h2>
            <div className="p-6 bg-neutral-900/40 border border-neutral-800/80 rounded-xl flex flex-col items-center justify-center">
              {totalIncome === 0 && totalExpense === 0 ? (
                <div className="text-center py-10">
                  <PieChart className="w-12 h-12 text-neutral-800 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500">Sin movimientos este mes</p>
                </div>
              ) : (
                <FinancePieChart 
                  data={[
                    { name: 'Ingresos', value: totalIncome, color: '#10b981' },
                    { name: 'Egresos', value: totalExpense, color: '#f43f5e' }
                  ]}
                />
              )}
            </div>
          </div>

          {/* Últimos Movimientos */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              Últimos Movimientos
            </h2>
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-900/80 text-neutral-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Fecha</th>
                      <th className="px-6 py-4 font-medium">Descripción</th>
                      <th className="px-6 py-4 font-medium">Categoría</th>
                      <th className="px-6 py-4 font-medium">Cuenta</th>
                      <th className="px-6 py-4 font-medium text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="px-6 py-4 text-neutral-300">
                          {new Date(tx.transaction_date).toLocaleDateString('es-AR', {
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{tx.description || 'Sin descripción'}</p>
                          {tx.reference_type && (
                            <p className="text-xs text-neutral-500">Ref: {tx.reference_type}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-800 text-neutral-300 text-xs">
                            {tx.category?.name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-neutral-400">
                          {tx.account?.name}
                        </td>
                        <td className={`px-6 py-4 font-semibold text-right ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount_cents)}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                          Aún no hay movimientos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModuleGuard>
  )
}
