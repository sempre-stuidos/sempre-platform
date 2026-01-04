"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { IconPlus, IconX, IconWand } from "@tabler/icons-react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ProductDetailsStepProps {
  benefits: string[]
  ingredients: string[]
  howToUse: string
  onBenefitsChange: (benefits: string[]) => void
  onIngredientsChange: (ingredients: string[]) => void
  onHowToUseChange: (howToUse: string) => void
  productName: string
}

export function ProductDetailsStep({
  benefits,
  ingredients,
  howToUse,
  onBenefitsChange,
  onIngredientsChange,
  onHowToUseChange,
  productName,
}: ProductDetailsStepProps) {
  const [isGeneratingBenefits, setIsGeneratingBenefits] = React.useState(false)

  // Initialize arrays if empty
  React.useEffect(() => {
    if (benefits.length === 0) {
      onBenefitsChange([''])
    }
    if (ingredients.length === 0) {
      onIngredientsChange([''])
    }
  }, [])

  const handleAddBenefit = () => {
    onBenefitsChange([...benefits, ''])
  }

  const handleRemoveBenefit = (index: number) => {
    if (benefits.length > 1) {
      onBenefitsChange(benefits.filter((_, i) => i !== index))
    } else {
      onBenefitsChange([''])
    }
  }

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...benefits]
    newBenefits[index] = value
    onBenefitsChange(newBenefits)
  }

  const handleAddIngredient = () => {
    onIngredientsChange([...ingredients, ''])
  }

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length > 1) {
      onIngredientsChange(ingredients.filter((_, i) => i !== index))
    } else {
      onIngredientsChange([''])
    }
  }

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients]
    newIngredients[index] = value
    onIngredientsChange(newIngredients)
  }

  const handleGenerateBenefits = async () => {
    if (!productName?.trim()) {
      toast.error('Please enter a product name first')
      return
    }
    
    setIsGeneratingBenefits(true)
    try {
      const response = await fetch('/api/products/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'benefits',
          productName: productName,
          currentBenefits: benefits.filter(b => b.trim() !== '')
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate benefits' }))
        throw new Error(errorData.error || 'Failed to generate benefits')
      }
      
      const data = await response.json()
      const existingBenefits = benefits.filter(b => b.trim() !== '')
      const newBenefit = data.benefits && data.benefits.length > 0 ? data.benefits[0] : ''
      if (newBenefit) {
        const newBenefits = [...existingBenefits, newBenefit]
        onBenefitsChange(newBenefits.length > 0 ? newBenefits : [''])
        toast.success('Benefit generated successfully')
      } else {
        toast.error('No benefit was generated')
      }
    } catch (error) {
      console.error('Error generating benefits:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate benefits. Please try again.')
    } finally {
      setIsGeneratingBenefits(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Product Details</h2>
        <p className="text-muted-foreground">
          Add benefits, ingredients, and usage instructions
        </p>
      </div>

      <div className="space-y-8">
        {/* Benefits */}
        <div className="space-y-2">
          <Label>Product Benefits/Features</Label>
          <p className="text-sm text-muted-foreground">
            Enter key benefits or features that will be displayed on your product page
          </p>
          
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={benefit}
                  onChange={(e) => handleBenefitChange(index, e.target.value)}
                  placeholder={`Benefit ${index + 1} (e.g., Stimulates scalp for healthier growth)`}
                  className="flex-1"
                />
                {benefits.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveBenefit(index)}
                    className="shrink-0"
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddBenefit}
                className="flex-1"
              >
                <IconPlus className="h-4 w-4 mr-2" />
                Add Benefit
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateBenefits}
                disabled={isGeneratingBenefits || !productName?.trim()}
                className="flex-1"
              >
                {isGeneratingBenefits ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <IconWand className="h-4 w-4 mr-2" />
                    Generate Benefit
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-2">
          <Label>Ingredients</Label>
          <p className="text-sm text-muted-foreground">
            List the ingredients used in this product
          </p>
          
          <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={ingredient}
                  onChange={(e) => handleIngredientChange(index, e.target.value)}
                  placeholder={`Ingredient ${index + 1} (e.g., Argan Oil)`}
                  className="flex-1"
                />
                {ingredients.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveIngredient(index)}
                    className="shrink-0"
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddIngredient}
              className="w-full"
            >
              <IconPlus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </div>
        </div>

        {/* How to Use */}
        <div className="space-y-2">
          <Label htmlFor="how_to_use">How to Use</Label>
          <p className="text-sm text-muted-foreground">
            Provide instructions on how to use this product
          </p>
          <Textarea
            id="how_to_use"
            value={howToUse}
            onChange={(e) => onHowToUseChange(e.target.value)}
            placeholder="Enter usage instructions..."
            rows={6}
          />
        </div>
      </div>
    </div>
  )
}

