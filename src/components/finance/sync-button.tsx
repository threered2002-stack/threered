'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Check } from 'lucide-react'
import { syncFinanceData } from '@/modules/finance/actions/finance'

export function SyncFinanceButton({ orgId }: { orgId: string }) {
  const router = useRouter()
  const [isSyncing, setIsSyncing] = useState(false)
  const [justSynced, setJustSynced] = useState(false)

  const handleSync = async () => {
    if (isSyncing) return
    setIsSyncing(true)
    try {
      const res = await syncFinanceData(orgId)
      if (res?.success) {
        setJustSynced(true)
        router.refresh()
        setTimeout(() => setJustSynced(false), 3000)
      } else {
        alert(res?.error || 'Error al sincronizar finanzas')
      }
    } catch (e) {
      alert('Error inesperado al sincronizar')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      title="Sincronizar ventas y compras históricas con Finanzas"
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
        justSynced
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
      }`}
    >
      {justSynced ? (
        <>
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Sincronizado</span>
        </>
      ) : (
        <>
          <RefreshCw className={`w-4 h-4 text-red-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
        </>
      )}
    </button>
  )
}
