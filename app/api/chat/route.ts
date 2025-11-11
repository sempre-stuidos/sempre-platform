import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.aimlapi.com/v1'
const AI_API_KEY = process.env.AI_API_KEY || 'd75d97c23cc14897920e34eafef280ea'
const AI_DEFAULT_MODEL = process.env.AI_DEFAULT_MODEL || 'gpt-4o'

interface ChatRequestBody {
  message: string
  conversationId?: string
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

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

  let body: ChatRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { message, conversationId: incomingConversationId } = body

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  let conversationId = incomingConversationId ?? null

  if (conversationId) {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (error || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
  } else {
    const title = message.slice(0, 80)
    
    // Verify user ID is valid UUID
    if (!user.id || typeof user.id !== 'string') {
      console.error('Invalid user ID:', user.id)
      return NextResponse.json(
        { 
          error: 'Failed to create conversation',
          details: 'Invalid user authentication'
        },
        { status: 401 }
      )
    }

    const { data: newConversation, error: insertError } = await supabase
      .from('conversations')
      .insert([
        {
          user_id: user.id,
          title: title || 'New Conversation',
          last_message_at: new Date().toISOString()
        }
      ])
      .select('id')
      .single()

    if (insertError) {
      console.error('Failed to create conversation', {
        error: insertError,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        user_id: user.id
      })
      
      // Return more detailed error information
      const errorDetails = insertError.message || insertError.details || 'Database error occurred'
      const errorHint = insertError.hint ? ` Hint: ${insertError.hint}` : ''
      
      return NextResponse.json(
        { 
          error: 'Failed to create conversation',
          details: `${errorDetails}${errorHint}`,
          code: insertError.code || 'UNKNOWN',
          hint: insertError.hint
        },
        { status: 500 }
      )
    }

    if (!newConversation || !newConversation.id) {
      console.error('Conversation created but no ID returned', newConversation)
      return NextResponse.json(
        { error: 'Failed to create conversation: No ID returned' },
        { status: 500 }
      )
    }

    conversationId = newConversation.id
  }

  const { error: userMessageError } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: message
  })

  if (userMessageError) {
    console.error('Failed to record user message', userMessageError)
    return NextResponse.json({ error: 'Failed to record user message' }, { status: 500 })
  }

  const { data: history, error: historyError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (historyError || !history) {
    console.error('Failed to load conversation history', historyError)
    return NextResponse.json({ error: 'Failed to load conversation history' }, { status: 500 })
  }

  // Detect if user is asking for data and fetch it from Supabase
  const messageLower = message.toLowerCase()
  let contextData = ''
  
  if (messageLower.includes('list') || messageLower.includes('show') || messageLower.includes('all') || messageLower.includes('current')) {
    if (messageLower.includes('project')) {
      try {
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, client_name, status, priority, due_date, progress, budget, description')
          .order('id', { ascending: true })
          .limit(50)

        if (projectsError) {
          console.error('Error fetching projects:', projectsError)
          contextData = '\n\nNote: Unable to fetch projects from database.'
        } else if (projects && projects.length > 0) {
          contextData = `\n\nCURRENT PROJECTS IN DATABASE:\n${projects.map((p, idx) => 
            `${idx + 1}. ${p.name} (ID: ${p.id})
   - Client: ${p.client_name || 'N/A'}
   - Status: ${p.status}
   - Priority: ${p.priority}
   - Due Date: ${p.due_date || 'N/A'}
   - Progress: ${p.progress || 0}%
   - Budget: $${p.budget || 0}
   - Description: ${p.description || 'No description'}`
          ).join('\n\n')}`
        } else {
          contextData = '\n\nCURRENT PROJECTS IN DATABASE: No projects found.'
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
        contextData = '\n\nNote: Unable to fetch projects from database.'
      }
    }
    
    if (messageLower.includes('task')) {
      try {
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, status, priority, due_date')
          .order('id', { ascending: true })
          .limit(20)

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError)
        } else if (tasks && tasks.length > 0) {
          const taskSummary = tasks.map((t, idx) => 
            `${idx + 1}. ${t.title} (Status: ${t.status}, Priority: ${t.priority || 'N/A'}, Due: ${t.due_date || 'N/A'})`
          ).join('\n')
          contextData += `\n\nCURRENT TASKS IN DATABASE:\n${taskSummary}`
        } else {
          contextData += '\n\nCURRENT TASKS IN DATABASE: No tasks found.'
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
      }
    }
    
    if (messageLower.includes('client')) {
      try {
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('id, name, status, priority, business_type')
          .order('id', { ascending: true })
          .limit(50)

        if (clientsError) {
          console.error('Error fetching clients:', clientsError)
        } else if (clients && clients.length > 0) {
          const clientSummary = clients.map((c, idx) => 
            `${idx + 1}. ${c.name} (Status: ${c.status}, Priority: ${c.priority || 'N/A'}, Type: ${c.business_type || 'N/A'})`
          ).join('\n')
          contextData += `\n\nCURRENT CLIENTS IN DATABASE:\n${clientSummary}`
        } else {
          contextData += '\n\nCURRENT CLIENTS IN DATABASE: No clients found.'
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
      }
    }
  }

  const systemPrompt = `You are an expert AI Project Manager with extensive experience in project planning, task management, team coordination, and delivery.
You help users plan projects, break down work into manageable tasks, set realistic timelines, identify risks, and optimize workflows.
Ask follow-up questions one at a time to understand project requirements, constraints, and goals. Keep responses professional, actionable, and grounded in proven project management methodologies (Agile, Scrum, Waterfall, etc.).
Provide specific, practical advice on project planning, resource allocation, risk management, and stakeholder communication.

CRITICAL: You have access to real-time data from the user's Supabase database. When users ask about projects, tasks, or clients, you MUST ONLY use the actual data provided in the context below. DO NOT make up, invent, or hallucinate any data. If the context shows no data, say "No [items] found in the database." If the context shows specific items, list ONLY those exact items with their exact details. Never add fictional data like "Acme Corporation" or "Globex Industries" unless they appear in the provided context.${contextData}`

  const messagesPayload = [
    { role: 'system', content: systemPrompt },
    ...history.map(entry => ({
      role: entry.role as 'user' | 'assistant',
      content: entry.content
    }))
  ]

  console.log('Calling AI API:', {
    url: `${AI_BASE_URL}/chat/completions`,
    model: AI_DEFAULT_MODEL,
    messageCount: messagesPayload.length,
    hasSystemPrompt: messagesPayload[0]?.role === 'system'
  })

  const aiResponse = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify({
      model: AI_DEFAULT_MODEL,
      messages: messagesPayload,
      temperature: 0.7,
      stream: true
    })
  })

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text()
    console.error('AI request failed', {
      status: aiResponse.status,
      statusText: aiResponse.statusText,
      error: errorText
    })
    return NextResponse.json(
      { 
        error: 'Failed to generate response',
        details: `AI API returned ${aiResponse.status}: ${errorText.slice(0, 200)}`
      },
      { status: 500 }
    )
  }

  if (!aiResponse.body) {
    console.error('AI response has no body')
    return NextResponse.json({ error: 'Failed to generate response: No response body' }, { status: 500 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      send({ type: 'conversation', conversationId })

      const reader = aiResponse.body!.getReader()
      let assistantContent = ''
      let chunkCount = 0
      let tokenCount = 0

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log(`Stream completed: ${chunkCount} chunks, ${tokenCount} tokens, ${assistantContent.length} total chars`)
            break
          }

          chunkCount++
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter(Boolean)

          for (const line of lines) {
            if (!line.startsWith('data:')) continue
            const data = line.replace(/^data:\s*/, '').trim()

            if (data === '[DONE]') {
              console.log('Received [DONE] marker')
              send({ type: 'done' })
              break
            }

            if (!data) continue

            try {
              const json = JSON.parse(data)
              
              // Handle different response formats
              const delta = json.choices?.[0]?.delta?.content ?? 
                           json.choices?.[0]?.message?.content ?? 
                           json.content ?? 
                           ''

              // Only process non-empty content (first chunk may have empty content but set role)
              if (delta && typeof delta === 'string' && delta.length > 0) {
                tokenCount++
                assistantContent += delta
                send({ type: 'token', value: delta })
              }

              // Check for finish reason
              const finishReason = json.choices?.[0]?.finish_reason
              if (finishReason) {
                console.log('Finish reason:', finishReason)
                if (finishReason !== 'stop' && finishReason !== null) {
                  console.warn('Unexpected finish reason:', finishReason)
                }
              }
            } catch (error) {
              // Only log if it's not an empty line or expected format
              if (data && data !== '[DONE]' && !data.startsWith('{')) {
                console.error('Failed to parse AI stream chunk', {
                  error,
                  data: data.slice(0, 200),
                  chunkNumber: chunkCount
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('Error streaming AI response', error)
        send({ type: 'error', message: `Streaming interrupted: ${error instanceof Error ? error.message : 'Unknown error'}` })
      } finally {
        if (assistantContent.trim().length > 0) {
          const now = new Date().toISOString()

          const [{ error: assistantInsertError }, { error: updateConversationError }] =
            await Promise.all([
              supabase
                .from('messages')
                .insert({
                  conversation_id: conversationId,
                  role: 'assistant',
                  content: assistantContent
                })
                .select('id'),
              supabase
                .from('conversations')
                .update({ last_message_at: now })
                .eq('id', conversationId)
            ])

          if (assistantInsertError) {
            console.error('Failed to store assistant message', assistantInsertError)
          }

          if (updateConversationError) {
            console.error('Failed to update conversation metadata', updateConversationError)
          }
        } else {
          console.warn('No assistant content to save. Content length:', assistantContent.length)
          send({ type: 'error', message: 'AI returned empty response' })
        }

        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}

