'use client'

import { useEffect, useState } from 'react'
import { 
  getGeneralReport, 
  getSalesChartData, 
  getTopCategoriesData, 
  getTopProducts, 
  getTopCustomers 
} from '@/modules/reports/actions/reports'
import { useOrg } from '@/providers/org-provider'
import { ModuleGuard } from '@/components/layout/module-guard'
import { BarChart3, TrendingUp, Users, Package, ArrowUpRight, DollarSign, Download, Calendar, Trophy, Star, User } from 'lucide-react'
import { SalesLineChart, CategoryPieChart } from '@/components/reports/report-charts'

export default function ReportsPage() {
  return (
    <ModuleGuard module="reports">
      <ReportsContent />
    </ModuleGuard>
  )
}

function ReportsContent() {
  const { currentOrg } = useOrg()
  const [report, setReport] = useState<any>(null)
  const [salesData, setSalesData] = useState<any[]>([])
  const [categoriesData, setCategoriesData] = useState<any[]>([])
  const [productsData, setProductsData] = useState<any>(null)
  const [customersData, setCustomersData] = useState<any[]>([])

  useEffect(() => {
    if (currentOrg) {
      getGeneralReport(currentOrg.id).then(setReport)
      getSalesChartData(currentOrg.id, 30).then(setSalesData)
      getTopCategoriesData(currentOrg.id).then(setCategoriesData)
      getTopProducts(currentOrg.id).then(setProductsData)
      getTopCustomers(currentOrg.id).then(setCustomersData)
    }
  }, [currentOrg])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(cents / 100)
  }

  if (!report || !productsData) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <BarChart3 className="w-8 h-8 text-red-500/50 mb-4 animate-bounce" />
          <p className="text-neutral-500">Analizando métricas en tiempo real...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-red-400" />
            Panel de Reportes
          </h1>
          <p className="text-neutral-400 mt-1">Métricas clave y rendimiento de tu negocio en tiempo real.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-neutral-900/50 text-neutral-300 font-medium rounded-xl border border-neutral-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-500" />
            Últimos 30 días
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20">
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all text-emerald-500">
            <TrendingUp className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            Ingresos (Mes)
          </p>
          <p className="text-3xl font-bold text-white mt-3">
            {formatCurrency(report.finance.monthlyIncomeCents)}
          </p>
          <p className="text-xs font-medium text-neutral-500 mt-2">
            Total facturado este mes
          </p>
        </div>

        <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all text-red-500">
            <DollarSign className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
            Ganancia Neta (Mes)
          </p>
          <p className="text-3xl font-bold text-white mt-3">
            {formatCurrency(report.finance.monthlyProfitCents)}
          </p>
          <p className="text-xs font-medium text-neutral-500 mt-2">
            Ingresos menos egresos
          </p>
        </div>

        <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all text-blue-500">
            <Users className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            Clientes en Base
          </p>
          <p className="text-3xl font-bold text-white mt-3">
            {report.customers.total}
          </p>
          <p className="text-xs font-medium text-neutral-500 mt-2">
            Registrados en el sistema
          </p>
        </div>

        <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all text-amber-500">
            <Package className="w-16 h-16" />
          </div>
          <p className="text-sm font-medium text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            Productos Activos
          </p>
          <p className="text-3xl font-bold text-white mt-3">
            {report.products.total}
          </p>
          <p className="text-xs font-medium text-neutral-500 mt-2">
            En el catálogo de venta
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Evolución de Ventas</h2>
            <p className="text-sm text-neutral-500">Últimos 30 días</p>
          </div>
          <div className="flex-1 min-h-[300px]">
            <SalesLineChart data={salesData} />
          </div>
        </div>

        {/* Pie Chart */}
        <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Categorías más Vendidas</h2>
            <p className="text-sm text-neutral-500">Por unidades (Top 5)</p>
          </div>
          <div className="flex-1 min-h-[300px]">
            <CategoryPieChart data={categoriesData} />
          </div>
        </div>

      </div>

      {/* Rankings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Products */}
        <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl">
          <div className="mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Productos Estrella</h2>
              <p className="text-sm text-neutral-500">Mayor volumen de ventas</p>
            </div>
          </div>
          <div className="space-y-4">
            {productsData.byQty.length > 0 ? (
              productsData.byQty.map((prod: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-xl">
                  <div>
                    <p className="text-white font-medium text-sm">{prod.name}</p>
                    <p className="text-xs text-neutral-500">{prod.qty} unidades vendidas</p>
                  </div>
                  <p className="text-emerald-400 font-semibold">{formatCurrency(prod.revenue * 100)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500 text-center py-4">No hay ventas registradas</p>
            )}
          </div>
        </div>

        {/* Most Profitable */}
        <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Más Rentables</h2>
              <p className="text-sm text-neutral-500">Mayor ganancia neta</p>
            </div>
          </div>
          <div className="space-y-4">
            {productsData.byProfit.length > 0 ? (
              productsData.byProfit.map((prod: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-xl">
                  <div>
                    <p className="text-white font-medium text-sm">{prod.name}</p>
                    <p className="text-xs text-neutral-500">Rentabilidad total</p>
                  </div>
                  <p className="text-red-400 font-semibold">{formatCurrency(prod.profit * 100)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500 text-center py-4">No hay rentabilidad registrada</p>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-blue-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">Top Clientes</h2>
                <p className="text-sm text-neutral-500">Mejores compradores</p>
              </div>
            </div>
            {customersData.length > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Top {customersData.length}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {customersData.length > 0 ? (
              customersData.map((cust: any, idx: number) => {
                const rankColor = 
                  idx === 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  idx === 1 ? 'bg-slate-300/20 text-slate-200 border-slate-300/40' :
                  idx === 2 ? 'bg-amber-700/20 text-amber-500 border-amber-700/40' :
                  'bg-neutral-800 text-neutral-400 border-neutral-700'

                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-neutral-800/30 hover:bg-neutral-800/60 border border-neutral-800/60 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border ${rankColor}`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {cust.name}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {cust.count} {cust.count === 1 ? 'compra realizada' : 'compras realizadas'}
                        </p>
                      </div>
                    </div>
                    <p className="text-blue-400 font-semibold text-sm">
                      {formatCurrency(cust.total * 100)}
                    </p>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-xl bg-neutral-800/60 flex items-center justify-center mx-auto mb-3 text-neutral-500">
                  <User className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-sm text-neutral-400 font-medium">Aún no hay clientes registrados en ventas</p>
                <p className="text-xs text-neutral-600 mt-1">Las ventas asignadas a clientes aparecerán aquí ordenadas por volumen.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
