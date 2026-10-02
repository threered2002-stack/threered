import { z } from 'zod'

// ============================================================================
// Schemas de autenticación
// ============================================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es obligatorio')
    .email('Ingresá un email válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre es demasiado largo'),
    email: z
      .string()
      .min(1, 'El email es obligatorio')
      .email('Ingresá un email válido'),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres')
      .max(72, 'La contraseña es demasiado larga'),
    confirm_password: z
      .string()
      .min(1, 'Confirmá tu contraseña'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  })

export type RegisterInput = z.infer<typeof registerSchema>

// ============================================================================
// Schemas de organización
// ============================================================================

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  slug: z
    .string()
    .min(2, 'El slug debe tener al menos 2 caracteres')
    .max(50, 'El slug es demasiado largo')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Solo letras minúsculas, números y guiones'
    ),
  template_id: z
    .string()
    .uuid('Seleccioná una plantilla de rubro'),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo')
    .optional(),
  logo_url: z.string().url('URL inválida').nullable().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
})

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>

// ============================================================================
// Schemas de membresía
// ============================================================================

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es obligatorio')
    .email('Ingresá un email válido'),
  role_id: z
    .string()
    .uuid('Seleccioná un rol'),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
