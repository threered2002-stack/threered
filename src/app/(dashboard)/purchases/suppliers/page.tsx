import { getSuppliers } from '@/modules/purchases/actions/purchases'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, Plus, Search, Mail, Phone, MapPin } from 'lucide-react'
import { ModuleGuard } from '@/components/layout/module-guard'

export default async function SuppliersPage() {
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

  const suppliers = await getSuppliers(membership.organization_id)

  return (
    <ModuleGuard module="purchases">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-red-400" />
              Proveedores
            </h1>
            <p className="text-neutral-400 mt-1">Directorio de empresas que abastecen tu inventario.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20 w-fit">
            <Plus className="w-4 h-4" />
            Nuevo Proveedor
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar proveedor por nombre, CUIT o contacto..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all placeholder:text-neutral-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 hover:bg-neutral-900/80 transition-colors group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400 font-bold group-hover:bg-red-500/20 group-hover:text-red-400 transition-colors">
                    {supplier.trade_name ? supplier.trade_name.charAt(0) : supplier.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-lg leading-tight">
                      {supplier.trade_name || supplier.name}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {supplier.tax_id ? `CUIT: ${supplier.tax_id}` : 'Sin CUIT'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {supplier.contact_name && (
                  <div className="flex items-center gap-2 text-sm text-neutral-300">
                    <span className="w-5 flex justify-center"><div className="w-1.5 h-1.5 rounded-full bg-neutral-600"></div></span>
                    {supplier.contact_name}
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <Phone className="w-4 h-4 shrink-0" />
                    {supplier.phone}
                  </div>
                )}
                {(supplier.address || supplier.city) && (
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {supplier.city ? `${supplier.city}, ${supplier.address || ''}` : supplier.address}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {suppliers.length === 0 && (
            <div className="col-span-full bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-12 text-center">
              <div className="flex flex-col items-center justify-center text-neutral-500">
                <Building2 className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium text-white mb-1">No tenés proveedores</p>
                <p className="text-sm">Agregá tu primer proveedor para poder emitirles órdenes de compra.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModuleGuard>
  )
}
