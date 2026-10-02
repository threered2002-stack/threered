'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createOrganization } from '@/modules/core/actions/organizations'
import { createClient } from '@/lib/supabase/client'
import type { Template } from '@/lib/types'
import { Wine, Wrench, ShoppingBag, Store } from 'lucide-react'

const templateIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  vinoteca: Wine,
  ferreteria: Wrench,
  verduleria: ShoppingBag,
  default: Store,
}

export default function NewOrganizationPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)

  const supabase = createClient()

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      const { data } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)

      if (data) setTemplates(data as Template[])
      setIsLoadingTemplates(false)
    }
    loadTemplates()
  }, [supabase])

  // Auto-generate slug from name
  useEffect(() => {
    const generated = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    setSlug(generated)
  }, [name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) {
      setError('Seleccioná una plantilla de rubro')
      return
    }

    setError(null)
    setIsLoading(true)

    const result = await createOrganization({
      name,
      slug,
      template_id: selectedTemplate,
    })

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      // Reload to pick up new org
      window.location.href = '/'
    }
  }

  const selectedTpl = templates.find((t) => t.id === selectedTemplate)

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Nueva Organización</h1>
        <p className="text-neutral-400 mt-1">
          Elegí un rubro y configurá tu negocio
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-3">
          Plantilla de Rubro
        </label>
        {isLoadingTemplates ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-28 bg-neutral-800/50 border border-neutral-700 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {templates.map((tpl) => {
              const Icon = templateIcons[tpl.slug] ?? templateIcons.default
              const isSelected = selectedTemplate === tpl.id

              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-neutral-700 bg-neutral-800/30 hover:border-neutral-600'
                  }`}
                >
                  <Icon
                    className={`w-8 h-8 ${
                      isSelected ? 'text-violet-400' : 'text-neutral-500'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? 'text-violet-300' : 'text-neutral-400'
                    }`}
                  >
                    {tpl.name}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {selectedTpl && (
          <p className="mt-3 text-sm text-neutral-500">
            {selectedTpl.description}
          </p>
        )}
      </div>

      {/* Organization Details */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-neutral-300 mb-1.5"
          >
            Nombre del Negocio
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Vinoteca Don Julio"
            required
            className="w-full px-3.5 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-neutral-300 mb-1.5"
          >
            Identificador (URL)
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="vinoteca-don-julio"
            required
            className="w-full px-3.5 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all font-mono text-sm"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Solo letras minúsculas, números y guiones
          </p>
        </div>

        {/* Selected template modules preview */}
        {selectedTpl && (
          <div className="bg-neutral-800/30 border border-neutral-700 rounded-xl p-4">
            <p className="text-sm font-medium text-neutral-300 mb-2">
              Módulos que se activarán:
            </p>
            <div className="flex flex-wrap gap-2">
              {(selectedTpl.default_modules as string[]).map((mod) => (
                <span
                  key={mod}
                  className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20"
                >
                  {mod}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !selectedTemplate}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creando organización...
            </span>
          ) : (
            'Crear Organización'
          )}
        </button>
      </form>
    </div>
  )
}
