import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formatea una fecha ISO a formato argentino.
 * Ej: "2024-03-15T10:30:00Z" → "15/03/2024"
 */
export function formatDate(date: string | Date, pattern: string = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: es })
}

/**
 * Formatea una fecha con hora.
 * Ej: "2024-03-15T10:30:00Z" → "15/03/2024 10:30"
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

/**
 * Formatea una fecha como "hace X tiempo".
 * Ej: "2024-03-15T10:30:00Z" → "hace 2 horas"
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: es })
}

/**
 * Formatea un número con separadores de miles.
 * Ej: 12345.67 → "12.345,67"
 */
export function formatNumber(
  value: number,
  decimals: number = 0,
  thousandsSep: string = '.',
  decimalSep: string = ','
): string {
  const fixed = value.toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep)

  if (decimals === 0 || !decPart) return intFormatted
  return `${intFormatted}${decimalSep}${decPart}`
}

/**
 * Formatea un porcentaje.
 * Ej: 21.5 → "21,50%"
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)}%`
}

/**
 * Genera las iniciales de un nombre.
 * Ej: "Juan Pérez" → "JP"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
