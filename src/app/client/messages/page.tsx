'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { MessageThread } from '@/components/chat/MessageThread'

interface CurrentUser {
  id: string
  name: string
  email: string
  role: string
  managerId: string | null
}

interface Conversation {
  id: string
  subject: string | null
  manager: { id: string; name: string; email: string; avatar: string | null }
}

export default function ClientMessagesPage() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [firstMsg, setFirstMsg] = useState('')
  const [subject, setSubject] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function init() {
      const meRes = await fetch('/api/users/me')
      if (!meRes.ok) return
      const { user: me } = await meRes.json()
      setUser(me)

      const convRes = await fetch(`/api/conversations?clientId=${me.id}`)
      if (convRes.ok) {
        const convs = await convRes.json()
        if (convs.length > 0) setConversation(convs[0])
      }
      setLoading(false)
    }
    init()
  }, [])

  async function startConversation() {
    if (!user?.managerId || !firstMsg.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user.id,
          managerId: user.managerId,
          subject: subject.trim() || undefined,
          firstMessage: firstMsg.trim(),
        }),
      })
      if (res.ok) {
        const { conversation: conv } = await res.json()
        // Reload full conversation with manager info
        const convRes = await fetch(`/api/conversations?clientId=${user.id}`)
        if (convRes.ok) {
          const convs = await convRes.json()
          if (convs.length > 0) setConversation(convs[0])
        } else {
          setConversation(conv)
        }
        setShowNew(false)
        setFirstMsg('')
        setSubject('')
      }
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        A carregar...
      </div>
    )
  }

  if (!user?.managerId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4 text-center gap-2">
        <MessageCircle size={36} className="opacity-30" />
        <p className="text-sm">Não tem um gestor associado.<br />Contacte o administrador.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <h1 className="font-semibold text-gray-900">Mensagens</h1>
        {!conversation && (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 text-sm bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <MessageCircle size={14} />
            Contactar gestor
          </button>
        )}
      </div>

      {/* Content */}
      {conversation ? (
        <div className="flex-1 overflow-hidden">
          <MessageThread
            conversationId={conversation.id}
            currentUserId={user.id}
            subject={conversation.subject}
            otherPartyName={conversation.manager.name}
          />
        </div>
      ) : showNew ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-md space-y-3">
            <h2 className="font-semibold text-gray-800 text-center">Nova mensagem para o seu gestor</h2>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto (opcional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <textarea
              value={firstMsg}
              onChange={(e) => setFirstMsg(e.target.value)}
              placeholder="Escreva a sua mensagem..."
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowNew(false)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={startConversation}
                disabled={!firstMsg.trim() || creating}
                className="flex-1 bg-blue-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                <Send size={14} />
                {creating ? 'A enviar...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
          <MessageCircle size={36} className="opacity-30" />
          <p className="text-sm text-center">Ainda não iniciou nenhuma conversa.<br />Clique em "Contactar gestor" para começar.</p>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <MessageCircle size={14} />
            Contactar gestor
          </button>
        </div>
      )}
    </div>
  )
}
