import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface ResetRequestBody {
  conversationId: string
}

export async function POST(request: Request) {
  const cookieStore = cookies()

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
            cookieStore.set(cookie)
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

  let body: ResetRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { conversationId } = body

  if (!conversationId || typeof conversationId !== 'string') {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
  }

  // Verify the conversation belongs to the user
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (conversationError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Delete messages first (due to foreign key constraint)
  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', conversationId)

  if (messagesError) {
    console.error('Failed to delete messages', messagesError)
    return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 })
  }

  // Delete conversation states
  const { error: statesError } = await supabase
    .from('conversation_states')
    .delete()
    .eq('conversation_id', conversationId)

  if (statesError) {
    console.error('Failed to delete conversation states', statesError)
    // Continue even if this fails
  }

  // Delete the conversation
  const { error: conversationDeleteError } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  if (conversationDeleteError) {
    console.error('Failed to delete conversation', conversationDeleteError)
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

