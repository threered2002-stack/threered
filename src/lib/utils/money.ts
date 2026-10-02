// ============================================================================
// Utilidades de dinero: centavos ↔ display
// ============================================================================

/**
 * Convierte centavos a string formateado para mostrar.
 * Ej: 125050 → "$1.250,50"
 */
export function formatMoney(
  cents: number,
  options?: {
    symbol?: string
    decimalSeparator?: string
    thousandsSeparator?: string
    showSymbol?: boolean
  }
): string {
  const {
    symbol = '$',
    decimalSeparator = ',',
    thousandsSeparator = '.',
    showSymbol = true,
  } = options ?? {}

  const isNegative = cents < 0
  const absCents = Math.abs(cents)
  const intPart = Math.floor(absCents / 100)
  const decPart = (absCents % 100).toString().padStart(2, '0')

  // Formatear con separador de miles
  const intStr = intPart
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)

  const formatted = `${intStr}${decimalSeparator}${decPart}`
  const prefix = isNegative ? '-' : ''

  return showSymbol ? `${prefix}${symbol}${formatted}` : `${prefix}${formatted}`
}

/**
 * Convierte un string de input del usuario a centavos.
 * Acepta formato argentino: "1.250,50" → 125050
 * También acepta formato con punto decimal: "1250.50" → 125050
 */
export function parseMoney(input: string): number {
  if (!input || input.trim() === '') return 0

  // Limpiar caracteres no numéricos excepto separadores
  let cleaned = input.replace(/[^0-9.,\-]/g, '')

  // Detectar formato: si tiene coma como decimal (argentino)
  if (cleaned.includes(',')) {
    // Formato argentino: 1.250,50
    cleaned = cleaned.replace(/\./g, '') // quitar separador de miles
    cleaned = cleaned.replace(',', '.')   // convertir decimal
  }

  const number = parseFloat(cleaned)
  if (isNaN(number)) return 0

  return Math.round(number * 100)
}

/**
 * Convierte centavos a número decimal para inputs.
 * Ej: 125050 → 1250.50
 */
export function centsToDecimal(cents: number): number {
  return cents / 100
}

/**
 * Convierte número decimal a centavos.
 * Ej: 1250.50 → 125050
 */
export function decimalToCents(decimal: number): number {
  return Math.round(decimal * 100)
}

/**
 * Calcula el porcentaje de un monto en centavos.
 */
export function percentOf(cents: number, percent: number): number {
  return Math.round((cents * percent) / 100)
}

/**
 * Calcula el margen entre costo y precio de venta.
 */
export function calculateMargin(costCents: number, priceCents: number): number {
  if (priceCents === 0) return 0
  return Math.round(((priceCents - costCents) / priceCents) * 10000) / 100
}
