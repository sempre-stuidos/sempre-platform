import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getBusinessById } from '@/lib/businesses'
import { transformProductRecord, Product } from '@/lib/products'
import { uploadGalleryImage, getGalleryImagePublicUrl } from '@/lib/gallery-images'
import { createFilesAssets } from '@/lib/files-assets'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.aimlapi.com/v1'
const AI_API_KEY = process.env.AI_API_KEY || 'd75d97c23cc14897920e34eafef280ea'

interface GenerateRequest {
  type: 'product' | 'image'
  orgId: string
  productId?: string
  sourceImageUrl?: string
  prompt?: string
}

async function generateImageFromProduct(product: Product): Promise<string> {
  // Build prompt from product information
  const benefitsText = product.benefits && product.benefits.length > 0
    ? `Key features: ${product.benefits.join(', ')}`
    : ''
  
  const prompt = `Generate a professional product image for ${product.name}. ${product.description || ''} ${benefitsText}. The image should be high quality, well-lit, and showcase the product attractively.`

  try {
    const response = await fetch(`${AI_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'google/nano-banana-pro',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Handle different response formats
    if (data.data && data.data[0] && data.data[0].url) {
      return data.data[0].url
    } else if (data.url) {
      return data.url
    } else if (data.image_url) {
      return data.image_url
    } else {
      throw new Error('Invalid response format from AI API')
    }
  } catch (error) {
    console.error('Error generating image from product:', error)
    throw error
  }
}

async function generateImageFromExistingImage(sourceImageUrl: string, prompt?: string): Promise<string> {
  try {
    // Download the source image
    const imageResponse = await fetch(sourceImageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to download source image')
    }
    
    const imageBlob = await imageResponse.blob()
    const imageBuffer = await imageBlob.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')
    
    // Build request body for image edit
    const requestBody: {
      model: string
      image: string
      prompt?: string
      n: number
      size: string
      response_format: string
    } = {
      model: 'google/nano-banana-pro-edit',
      image: `data:${imageBlob.type};base64,${imageBase64}`,
      n: 1,
      size: '1024x1024',
      response_format: 'url'
    }

    if (prompt && prompt.trim()) {
      requestBody.prompt = prompt.trim()
    }

    const response = await fetch(`${AI_BASE_URL}/images/edits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Handle different response formats
    if (data.data && data.data[0] && data.data[0].url) {
      return data.data[0].url
    } else if (data.url) {
      return data.url
    } else if (data.image_url) {
      return data.image_url
    } else {
      throw new Error('Invalid response format from AI API')
    }
  } catch (error) {
    console.error('Error generating image from existing image:', error)
    throw error
  }
}

async function downloadAndUploadImage(imageUrl: string, orgId: string, businessSlug: string, productId?: string): Promise<{ imageUrl: string; fileAssetId: string }> {
  try {
    // Download the generated image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to download generated image')
    }

    const imageBlob = await imageResponse.blob()
    const imageBuffer = await imageBlob.arrayBuffer()
    
    // Create a File object from the blob
    const timestamp = Date.now()
    const fileName = `ai-generated-${timestamp}.png`
    const file = new File([imageBuffer], fileName, { type: imageBlob.type || 'image/png' })

    // Upload to Supabase gallery storage using the same pattern as upload route
    // Use orgId format: org-id/filename
    const sanitizedOrgId = orgId.replace(/[^a-zA-Z0-9-_]/g, '-')
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-')
    const filePath = `${sanitizedOrgId}/${sanitizedFileName}`

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('gallery')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError || !uploadData) {
      throw new Error('Failed to upload image to storage')
    }

    // Get public URL
    const publicUrl = getGalleryImagePublicUrl(uploadData.path, supabaseAdmin)

    // Create database record
    const fileSize = `${(imageBlob.size / 1024).toFixed(1)} KB`
    const uploadedDate = new Date().toISOString().split('T')[0]
    
    const fileAsset = await createFilesAssets({
      name: `AI Generated - ${timestamp}`,
      type: "Images",
      category: "Client Assets",
      project: "Gallery",
      size: fileSize,
      format: "PNG",
      uploaded: uploadedDate,
      status: "Active",
      file_url: uploadData.path,
      image_category: null,
      product_id: productId,
    })

    if (!fileAsset) {
      throw new Error('Failed to create file asset record')
    }

    return {
      imageUrl: publicUrl,
      fileAssetId: fileAsset.id,
    }
  } catch (error) {
    console.error('Error downloading and uploading image:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(cookie => {
            cookieStore.set(cookie.name, cookie.value, cookie.options)
          })
        }
      }
    }
  )

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: GenerateRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { type, orgId, productId, sourceImageUrl, prompt } = body

  if (!type || !['product', 'image'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type. Must be "product" or "image"' }, { status: 400 })
  }

  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  // Verify user has access to this organization
  const { getUserRoleInOrg } = await import('@/lib/businesses')
  const role = await getUserRoleInOrg(user.id, orgId, supabase)
  if (!role) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Get business to retrieve slug
    const business = await getBusinessById(orgId, supabaseAdmin)
    if (!business || !business.slug) {
      return NextResponse.json({ error: 'Business not found or missing slug' }, { status: 404 })
    }

    let generatedImageUrl: string

    if (type === 'product') {
      if (!productId) {
        return NextResponse.json({ error: 'Product ID is required for product generation' }, { status: 400 })
      }

      // Fetch product details
      const { data: productData, error: productError } = await supabaseAdmin
        .from('retail_products_table')
        .select('*')
        .eq('id', productId)
        .eq('business_id', orgId)
        .single()

      if (productError || !productData) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      const product = transformProductRecord(productData)
      
      // Generate image from product
      generatedImageUrl = await generateImageFromProduct(product)
    } else {
      // type === 'image'
      if (!sourceImageUrl) {
        return NextResponse.json({ error: 'Source image URL is required for image generation' }, { status: 400 })
      }

      // Generate image from existing image
      generatedImageUrl = await generateImageFromExistingImage(sourceImageUrl, prompt)
    }

    // Download and upload the generated image
    const { imageUrl, fileAssetId } = await downloadAndUploadImage(
      generatedImageUrl,
      orgId,
      business.slug,
      type === 'product' ? productId : undefined
    )

    return NextResponse.json({
      imageUrl,
      fileAssetId,
    })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
