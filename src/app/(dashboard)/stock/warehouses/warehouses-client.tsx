'use client'

import { useState } from 'react'
import { Warehouse, Plus, MoreVertical, MapPin, Edit } from 'lucide-react'
import { WarehouseModal } from './warehouse-modal'

interface WarehousesClientProps {
  initialWarehouses: any[]
}

export function WarehousesClient({ initialWarehouses }: WarehousesClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null)

  const handleOpenNew = () => {
    setEditingWarehouse(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (warehouse: any) => {
    setEditingWarehouse(warehouse)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <WarehouseModal 
        warehouse={editingWarehouse}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-red-400" />
            Depósitos y Ubicaciones
          </h1>
          <p className="text-neutral-400 mt-1">Administrá las ubicaciones físicas de tu stock.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20 w-fit"
        >
          <Plus className="w-4 h-4" />
          Nuevo Depósito
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialWarehouses.map((wh) => (
          <div key={wh.id} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 relative group overflow-hidden hover:bg-neutral-900/80 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Warehouse className="w-24 h-24" />
            </div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${wh.is_default ? 'bg-red-500/20 text-red-400' : 'bg-neutral-800 text-neutral-400 group-hover:text-red-400'}`}>
                  <Warehouse className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                    {wh.name}
                    {wh.is_default && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase tracking-wider">
                        Principal
                      </span>
                    )}
                  </h3>
                  <p className={`text-xs font-medium ${wh.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                    {wh.is_active ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleOpenEdit(wh)}
                className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>

            {wh.address ? (
              <div className="flex items-start gap-2 text-neutral-400 text-sm mt-4 relative z-10">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-neutral-500" />
                <span>{wh.address}</span>
              </div>
            ) : (
              <div className="text-neutral-500 text-sm mt-4 italic relative z-10">
                Sin dirección registrada
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-neutral-800/80 flex gap-2 relative z-10">
              <a 
                href="/stock"
                className="flex-1 text-center py-2 bg-neutral-800/50 hover:bg-neutral-800 text-sm font-medium text-neutral-300 rounded-lg transition-colors"
              >
                Ver Inventario
              </a>
            </div>
          </div>
        ))}

        {/* Tarjeta para crear nuevo depósito */}
        <button 
          onClick={handleOpenNew}
          className="bg-neutral-900/20 border-2 border-dashed border-neutral-800 hover:border-red-500/50 hover:bg-red-500/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px] transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-neutral-800 group-hover:bg-red-500/20 flex items-center justify-center mb-3 transition-colors">
            <Plus className="w-6 h-6 text-neutral-400 group-hover:text-red-400" />
          </div>
          <p className="font-medium text-white">Agregar Depósito</p>
          <p className="text-sm text-neutral-500 mt-1">Sucursal, Galpón, etc.</p>
        </button>
      </div>
    </div>
  )
}
