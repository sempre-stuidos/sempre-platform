import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.aimlapi.com/v1'
const AI_API_KEY = process.env.AI_API_KEY || 'd75d97c23cc14897920e34eafef280ea'
const AI_DEFAULT_MODEL = process.env.AI_DEFAULT_MODEL || 'gpt-4o'

interface GenerateRequest {
  type: 'description' | 'benefits'
  productName: string
  currentDescription?: string
  currentBenefits?: string[]
}

async function callAI(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert product marketing assistant. Generate compelling product descriptions and benefits. Always return valid JSON without markdown formatting when requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    let content = data.choices[0].message.content
    
    // Clean up markdown code blocks if present
    if (content.includes('```json')) {
      content = content.replace(/```json\s*/, '').replace(/\s*```$/, '')
    } else if (content.includes('```')) {
      content = content.replace(/```\s*/, '').replace(/\s*```$/, '')
    }
    
    return content.trim()
  } catch (error) {
    console.error('AI API call failed:', error)
    throw error
  }
}

export async function POST(request: Request) {
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

  const { type, productName, currentDescription, currentBenefits } = body

  if (!type || !['description', 'benefits'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type. Must be "description" or "benefits"' }, { status: 400 })
  }

  if (!productName || !productName.trim()) {
    return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
  }

  try {
    let prompt = ''
    let responseFormat = ''

    if (type === 'description') {
      // Description generation prompt
      const descriptionContext = currentDescription
        ? `The user has provided this initial description: "${currentDescription}". Please create an improved, professional version that incorporates any important details they mentioned.`
        : ''

      prompt = `Generate a short, compelling product description (2-4 sentences) for a product named "${productName}".
${descriptionContext}
The description should be clear, engaging, and highlight the product's key features and benefits. Keep it concise and suitable for an e-commerce product page.
Return only the description text, no additional formatting.`

      responseFormat = 'plain text'
    } else {
      // Benefits generation prompt
      const descriptionContext = currentDescription
        ? `Product description: "${currentDescription}"`
        : ''
      
      const benefitsContext = currentBenefits && currentBenefits.length > 0
        ? `Existing benefits: ${currentBenefits.join(', ')}. Generate additional unique benefits that complement these.`
        : "Generate key benefits that highlight the product's value proposition."

      prompt = `Generate 1 product benefit or feature for a product named "${productName}".
${descriptionContext ? `${descriptionContext}\n` : ''}${benefitsContext}
The benefit should be a short, clear statement (max 10 words). Return as a JSON array with a single string: ["benefit"]`

      responseFormat = 'JSON array'
    }

    const response = await callAI(prompt)
    
    if (type === 'description') {
      // For description, return the text directly
      return NextResponse.json({
        description: response
      })
    } else {
      // For benefits, parse JSON array
      try {
        const result = JSON.parse(response)
        
        if (!Array.isArray(result)) {
          throw new Error('Invalid response format: expected array')
        }

        // Validate that all items are strings
        const benefits = result.filter((item: unknown) => typeof item === 'string' && item.trim().length > 0)
        
        if (benefits.length === 0) {
          throw new Error('No valid benefits generated')
        }

        return NextResponse.json({
          benefits
        })
      } catch (parseError) {
        console.error('Failed to parse AI response:', response)
        throw new Error('AI returned invalid JSON format')
      }
    }
  } catch (error) {
    console.error('Error generating product content:', error)
    return NextResponse.json(
      { 
        error: `Failed to generate ${type}`,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
