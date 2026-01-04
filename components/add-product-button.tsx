"use client"

import { IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface AddProductButtonProps {
  orgId: string
  onProductSaved?: (product: any) => void
}

export function AddProductButton({ orgId }: AddProductButtonProps) {
  const router = useRouter()

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => {
        router.push(`/client/${orgId}/retail/products/new`)
      }}
    >
      <IconPlus className="h-4 w-4 mr-2" />
      Add Product
    </Button>
  )
}

