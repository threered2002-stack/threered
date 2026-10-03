'use client'

import { useEffect, useState } from 'react'
import { useOrg } from '@/providers/org-provider'
import { PurchaseOrderForm } from './form'
import { getSuppliers } from '@/modules/purchases/actions/purchases'
import { getProducts } from '@/modules/stock/actions/products'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function NewPurchaseOrderPage() {
  const { currentOrg } = useOrg()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!currentOrg) return
      
      const supabase = createClient()
      
      // We can use the existing actions or raw queries
      const [supps, prods, { data: whs }] = await Promise.all([
        getSuppliers(currentOrg.id),
        getProducts(currentOrg.id, 1, 500, ''),
        supabase.from('warehouses').select('*').eq('organization_id', currentOrg.id)
      ])

      setSuppliers(supps)
      setProducts(prods.data || [])
      setWarehouses(whs || [])
      setIsLoading(false)
    }
    
    loadData()
  }, [currentOrg])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
        <p className="text-neutral-500 text-sm">Cargando formulario...</p>
      </div>
    )
  }

  return (
    <PurchaseOrderForm 
      suppliers={suppliers} 
      warehouses={warehouses} 
      products={products} 
    />
  )
}
