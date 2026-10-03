'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProducts(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name),
      stock:product_stock_cache(quantity, warehouse_id, warehouse:warehouses(name))
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data
}

export async function getProductById(id: string, orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name)
    `)
    .eq('id', id)
    .eq('organization_id', orgId)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data
}

export async function getCategories(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('organization_id', orgId)
    .order('sort_order')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data
}

export async function createProduct(orgId: string, input: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { data, error } = await supabase
    .from('products')
    .insert({
      ...input,
      organization_id: orgId,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return { error: 'Error al crear el producto' }
  }

  revalidatePath('/stock')
  return { data }
}

export async function updateProduct(id: string, orgId: string, input: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .update(input)
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return { error: 'Error al actualizar el producto' }
  }

  revalidatePath('/stock')
  return { data }
}

export async function deleteProduct(id: string, orgId: string) {
  const supabase = await createClient()

  // Soft delete setting deleted_at to now
  const { data, error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single()

  if (error) {
    console.error('Error deleting product:', error)
    return { error: 'Error al eliminar el producto' }
  }

  revalidatePath('/stock')
  return { data }
}
