'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Send, Lock } from 'lucide-react'
import { clsx } from 'clsx'

interface Message {
  id: string
  content: string
  createdAt: string
  readAt: string | null
  sender: { id: string; name: string; avatar: string | null; role: string }
}

interface Props {
  conversationId: string
  currentUserId: string
  readOnly?: boolean
  subject?: string | null
  otherPartyName: string
}

function Avatar({ name, avatar, size = 7 }: { name: string; avatar?: string | null; size?: number }) {
  if (avatar) return (
    <img src={avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />
  )
  return (
    <div className={`w-${size} h-${size} rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600 font-semibold text-xs`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function formatMsgTime(iso: string) {
  return format(new Date(iso), "d MMM 'às' HH:mm", { locale: ptBR })
}

export function MessageThread({ conversationId, currentUserId, readOnly, subject, otherPartyName }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  async function loadMessages() {
    const res = await fetch(`/api/conversations/${conversationId}/messages`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data)
    }
  }

  async function markRead() {
    await fetch(`/api/conversations/${conversationId}/read?userId=${currentUserId}`, { method: 'POST' })
  }

  useEffect(() => {
    loadMessages()
    markRead()
    const interval = setInterval(() => {
      loadMessages()
      markRead()
    }, 4000)
    return () => clearInterval(interval)
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUserId, content }),
      })
      if (res.ok) {
        setText('')
        await loadMessages()
        inputRef.current?.focus()
      }
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{otherPartyName}</p>
          {subject && <p className="text-xs text-gray-400 truncate">{subject}</p>}
        </div>
        {readOnly && (
          <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">
            <Lock size={10} /> Somente leitura
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Nenhuma mensagem ainda
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender.id === currentUserId
          return (
            <div key={msg.id} className={clsx('flex gap-2', isMine ? 'flex-row-reverse' : 'flex-row')}>
              {!isMine && <Avatar name={msg.sender.name} avatar={msg.sender.avatar} />}
              <div className={clsx('max-w-[70%] flex flex-col gap-0.5', isMine ? 'items-end' : 'items-start')}>
                {!isMine && (
                  <span className="text-[10px] text-gray-400 px-1">{msg.sender.name}</span>
                )}
                <div className={clsx(
                  'px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words',
                  isMine
                    ? 'bg-blue-500 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                )}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 px-1">{formatMsgTime(msg.createdAt)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!readOnly && (
        <div className="flex-shrink-0 border-t border-gray-100 bg-white px-3 py-2 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva uma mensagem... (Enter para enviar)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent max-h-32 overflow-y-auto"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
