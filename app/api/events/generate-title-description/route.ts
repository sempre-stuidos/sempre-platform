import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.aimlapi.com/v1'
const AI_API_KEY = process.env.AI_API_KEY || 'd75d97c23cc14897920e34eafef280ea'
const AI_DEFAULT_MODEL = process.env.AI_DEFAULT_MODEL || 'gpt-4o'

interface GenerateRequest {
  tone: 'Classic' | 'Playful' | 'Elegant'
  eventContext?: {
    eventType?: string
    startDate?: string
    startTime?: string
    endDate?: string
    endTime?: string
    dayOfWeek?: number
    isWeekly?: boolean
  }
  refinement?: 'regenerate' | 'shorten' | 'formalize'
  currentTitle?: string
  currentDescription?: string
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
            content: 'You are an expert event marketing assistant. Generate compelling event titles and descriptions. Always return valid JSON without markdown formatting.'
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

  const { tone, eventContext, refinement, currentTitle, currentDescription } = body

  if (!tone || !['Classic', 'Playful', 'Elegant'].includes(tone)) {
    return NextResponse.json({ error: 'Invalid tone' }, { status: 400 })
  }

  try {
    // Build context string
    let contextString = ''
    if (eventContext) {
      const parts: string[] = []
      if (eventContext.eventType) {
        parts.push(`Event Type: ${eventContext.eventType}`)
      }
      if (eventContext.startDate) {
        parts.push(`Date: ${eventContext.startDate}`)
      }
      if (eventContext.startTime) {
        parts.push(`Time: ${eventContext.startTime}`)
      }
      if (eventContext.isWeekly && eventContext.dayOfWeek !== undefined) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        parts.push(`Weekly event on ${days[eventContext.dayOfWeek]}`)
      }
      contextString = parts.length > 0 ? `\n\nEvent Context:\n${parts.join('\n')}` : ''
    }

    // Build tone description
    const toneDescriptions = {
      Classic: 'professional, traditional, and refined',
      Playful: 'fun, casual, and energetic',
      Elegant: 'sophisticated, upscale, and polished'
    }

    // Build prompt based on refinement type
    let prompt = ''
    
    if (refinement === 'shorten') {
      prompt = `You have an event with this title and description:

Title: ${currentTitle || 'Not provided'}
Description: ${currentDescription || 'Not provided'}${contextString}

Please create a SHORTER version with the same ${toneDescriptions[tone]} tone. Make the title more concise and the description more brief while keeping the essential information.

Return as JSON:
{
  "title": "shorter title",
  "description": "shorter description"
}`
    } else if (refinement === 'formalize') {
      prompt = `You have an event with this title and description:

Title: ${currentTitle || 'Not provided'}
Description: ${currentDescription || 'Not provided'}${contextString}

Please rewrite this in a more formal, professional tone while keeping the same information. Make it sound more sophisticated and polished.

Return as JSON:
{
  "title": "more formal title",
  "description": "more formal description"
}`
    } else {
      // Generate new or regenerate
      prompt = `Generate an event title and description with a ${toneDescriptions[tone]} tone.${contextString}

${currentTitle && currentDescription ? `You can use this as inspiration, but create something fresh:\nTitle: ${currentTitle}\nDescription: ${currentDescription}\n\n` : ''}The title should be catchy and clear (max 60 characters). The description should be engaging and informative (2-4 sentences).

Return as JSON:
{
  "title": "event title",
  "description": "event description"
}`
    }

    const response = await callAI(prompt)
    
    try {
      const result = JSON.parse(response)
      
      if (!result.title || !result.description) {
        throw new Error('Invalid response format')
      }

      return NextResponse.json({
        title: result.title,
        description: result.description
      })
    } catch (parseError) {
      console.error('Failed to parse AI response:', response)
      throw new Error('AI returned invalid JSON format')
    }
  } catch (error) {
    console.error('Error generating event text:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate event text',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

