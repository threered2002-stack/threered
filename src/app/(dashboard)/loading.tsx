import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
        
        {/* Spinner */}
        <div className="relative bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl shadow-xl">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-neutral-400">
        Cargando módulo...
      </p>
    </div>
  )
}
