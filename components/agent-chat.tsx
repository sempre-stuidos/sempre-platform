'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type ChatRole = 'user' | 'assistant'

export interface AgentMessage {
  id: string
  role: ChatRole
  content: string
  created_at?: string
}

interface AgentChatProps {
  initialConversationId?: string | null
  initialMessages?: AgentMessage[]
}

interface StreamEventToken {
  type: 'token'
  value: string
}

interface StreamEventConversation {
  type: 'conversation'
  conversationId: string
}

interface StreamEventDone {
  type: 'done'
}

interface StreamEventError {
  type: 'error'
  message: string
}

type StreamEvent =
  | StreamEventToken
  | StreamEventConversation
  | StreamEventDone
  | StreamEventError

export function AgentChat({
  initialConversationId = null,
  initialMessages = []
}: AgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>(initialMessages)
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const streamingMessageIdRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsStreaming(false)
    streamingMessageIdRef.current = null
    setStreamingMessageId(null)
  }, [])

  useEffect(() => {
    return () => {
      stopStreaming()
    }
  }, [stopStreaming])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!input.trim() || isStreaming) {
        return
      }

      const userMessage: AgentMessage = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content: input.trim()
      }

      setMessages(prev => [...prev, userMessage])
      setInput('')
      setIsStreaming(true)

      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: userMessage.content,
            conversationId
          }),
          signal: controller.signal
        })

        if (!response.ok || !response.body) {
          let errorMessage = 'Failed to reach the AI agent.'
          try {
            const errorData = await response.json()
            errorMessage = errorData.details || errorData.error || errorMessage
            if (errorData.hint) {
              errorMessage += ` (${errorData.hint})`
            }
          } catch {
            const errorText = await response.text()
            if (errorText) {
              try {
                const parsed = JSON.parse(errorText)
                errorMessage = parsed.details || parsed.error || errorMessage
              } catch {
                errorMessage = errorText || errorMessage
              }
            }
          }
          throw new Error(errorMessage)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        let assistantMessage = ''

        // Initial placeholder assistant bubble
        const assistantMessageId = `temp-assistant-${Date.now()}`
        streamingMessageIdRef.current = assistantMessageId
        setStreamingMessageId(assistantMessageId)

        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: ''
          }
        ])

        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const events = parseSseChunk(chunk)

          for (const event of events) {
            if (event.type === 'conversation') {
              setConversationId(event.conversationId)
            }

            if (event.type === 'token') {
              assistantMessage += event.value
              setMessages(prev =>
                prev.map(message =>
                  message.id === assistantMessageId
                    ? { ...message, content: assistantMessage }
                    : message
                )
              )
            }

            if (event.type === 'error') {
              throw new Error(event.message || 'Streaming error encountered.')
            }
          }
        }

        streamingMessageIdRef.current = null
        setStreamingMessageId(null)

        if (assistantMessage.trim().length === 0) {
          setMessages(prev => prev.filter(message => message.id !== assistantMessageId))
          toast.error('The agent did not return a response. Please check the server logs for details.')
          console.error('Empty assistant message received. Check API route logs for AI response details.')
        }
      } catch (error) {
        console.error(error)
        stopStreaming()
        const activeStreamingId = streamingMessageIdRef.current
        if (activeStreamingId) {
          setMessages(prev => prev.filter(message => message.id !== activeStreamingId))
        }
        toast.error(error instanceof Error ? error.message : 'Failed to connect to the agent.')
      } finally {
        abortControllerRef.current = null
        setIsStreaming(false)
        streamingMessageIdRef.current = null
        setStreamingMessageId(null)
      }
    },
    [conversationId, input, isStreaming, stopStreaming]
  )

  const roleLabels = useMemo(
    () => ({
      user: 'You',
      assistant: 'AI Project Manager'
    }),
    []
  )

  const handleReset = useCallback(async () => {
    if (!conversationId || isResetting) return

    const confirmed = window.confirm('Are you sure you want to reset this conversation? All messages will be deleted.')
    if (!confirmed) return

    setIsResetting(true)
    stopStreaming()

    try {
      const response = await fetch('/api/chat/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversationId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reset conversation')
      }

      // Clear local state
      setMessages([])
      setConversationId(null)
      setInput('')
      toast.success('Conversation reset successfully')
    } catch (error) {
      console.error('Error resetting conversation:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reset conversation')
    } finally {
      setIsResetting(false)
    }
  }, [conversationId, isResetting, stopStreaming])

  return (
    <div className="flex h-full flex-col gap-4">
      {messages.length > 0 && (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isResetting || isStreaming}
            className="text-muted-foreground hover:text-destructive"
          >
            {isResetting ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Resetting...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Reset Chat
              </>
            )}
          </Button>
        </div>
      )}
      <div
        ref={chatContainerRef}
        className="h-[calc(100vh-280px)] overflow-y-auto rounded-lg border border-border bg-card/50 p-6 shadow-sm backdrop-blur-sm"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-3 max-w-md">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Start a conversation</h3>
              <p className="text-sm text-muted-foreground">
                Ask me anything about project management, planning, or task organization.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                role={message.role}
                label={roleLabels[message.role]}
                content={message.content}
                isStreaming={isStreaming && message.id === streamingMessageId}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
        <Textarea
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              if (!isStreaming && input.trim().length > 0) {
                handleSubmit(event as any)
              }
            }
          }}
          placeholder="Ask about project planning, task management, timelines, or get advice on managing your projects..."
          disabled={isStreaming}
          className="min-h-[100px] resize-none bg-background/80 focus:bg-background transition-colors"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">⌘</kbd> + <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">Enter</kbd> to send
          </p>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <Button type="button" variant="ghost" size="sm" onClick={stopStreaming}>
                Stop
              </Button>
            )}
            <Button type="submit" disabled={isStreaming || input.trim().length === 0} size="default">
              {isStreaming ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Thinking...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

interface MessageBubbleProps {
  role: ChatRole
  label: string
  content: string
  isStreaming?: boolean
}

function MessageBubble({ role, label, content, isStreaming = false }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex w-full gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
          <svg
            className="h-4 w-4 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
      )}
      <div
        className={cn(
          'flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%]',
          isUser && 'items-end'
        )}
      >
        <p className={cn('text-xs font-medium px-1', isUser ? 'text-muted-foreground' : 'text-primary')}>
          {label}
        </p>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm shadow-sm transition-all',
            isUser
              ? 'bg-primary text-primary-foreground border border-primary/20 shadow-primary/20'
              : 'bg-muted/80 text-foreground border border-border/50 backdrop-blur-sm',
            isStreaming && !isUser && 'animate-pulse'
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {content ? (
              content.split('\n').map((line, index) => (
                <p key={index} className="whitespace-pre-wrap leading-relaxed mb-2 last:mb-0">
                  {line || '\u00A0'}
                </p>
              ))
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse" />
                <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse delay-75" />
                <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse delay-150" />
              </div>
            )}
          </div>
        </div>
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
          <svg
            className="h-4 w-4 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      )}
    </div>
  )
}

function parseSseChunk(chunk: string): StreamEvent[] {
  const lines = chunk.split('\n').filter(Boolean)
  const events: StreamEvent[] = []

  for (const line of lines) {
    if (!line.startsWith('data:')) continue
    const data = line.replace(/^data:\s*/, '')

    if (data === '[DONE]') {
      events.push({ type: 'done' })
      continue
    }

    try {
      const parsed = JSON.parse(data) as StreamEvent
      if (parsed && typeof parsed === 'object' && 'type' in parsed) {
        events.push(parsed)
      }
    } catch (error) {
      console.error('Failed to parse SSE payload', error, data)
    }
  }

  return events
}

