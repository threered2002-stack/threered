'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string) => void
    error: (message: string, title?: string) => void
    info: (message: string, title?: string) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, title, message }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: (message: string, title?: string) => addToast('success', message, title),
    error: (message: string, title?: string) => addToast('error', message, title),
    info: (message: string, title?: string) => addToast('info', message, title),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success'
          const isError = t.type === 'error'

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
                isSuccess
                  ? 'bg-neutral-900/95 border-emerald-500/30 text-white shadow-emerald-500/10'
                  : isError
                  ? 'bg-neutral-900/95 border-rose-500/30 text-white shadow-rose-500/10'
                  : 'bg-neutral-900/95 border-neutral-700 text-white shadow-black/40'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isSuccess
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : isError
                    ? 'bg-rose-500/15 text-rose-400'
                    : 'bg-blue-500/15 text-blue-400'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                {isError && <AlertCircle className="w-5 h-5" />}
                {!isSuccess && !isError && <Info className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                {t.title && <p className="font-semibold text-sm leading-tight text-white mb-0.5">{t.title}</p>}
                <p className="text-xs text-neutral-300 leading-relaxed break-words">{t.message}</p>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                title="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
