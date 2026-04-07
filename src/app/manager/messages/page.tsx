'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { ConversationList, type ConversationPreview } from '@/components/chat/ConversationList'
import { MessageThread } from '@/components/chat/MessageThread'

export default function ManagerMessagesPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationPreview[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadConversations(currentUserId: string) {
    // Fetch all conversations; mark as readOnly those not belonging to this manager
    const res = await fetch(`/api/conversations?viewAll=true&viewerId=${currentUserId}`)
    if (!res.ok) return
    const all: ConversationPreview[] = await res.json()
    const enriched = all.map((c) => ({
      ...c,
      readOnly: c.manager.id !== currentUserId,
    }))
    // Own conversations first, then others
    enriched.sort((a, b) => {
      if (a.readOnly === b.readOnly) return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      return a.readOnly ? 1 : -1
    })
    setConversations(enriched)
  }

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/auth/me')
      if (!res.ok) return
      const { user } = await res.json()
      setUserId(user.userId)
      await loadConversations(user.userId)
      setLoading(false)
    }
    init()
  }, [])

  // Poll conversations list
  useEffect(() => {
    if (!userId) return
    const interval = setInterval(() => loadConversations(userId), 8000)
    return () => clearInterval(interval)
  }, [userId])

  const selected = conversations.find((c) => c.id === selectedId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
        A carregar...
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-gray-100 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100">
          <h1 className="font-semibold text-gray-900">Mensagens</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {conversations.filter((c) => !c.readOnly).length} clientes seus
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            currentUserId={userId ?? ''}
            onSelect={setSelectedId}
          />
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-hidden">
        {selected && userId ? (
          <MessageThread
            conversationId={selected.id}
            currentUserId={userId}
            readOnly={selected.readOnly}
            subject={selected.subject}
            otherPartyName={selected.client.name}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <MessageCircle size={36} className="opacity-30" />
            <p className="text-sm">Selecione uma conversa</p>
          </div>
        )}
      </div>
    </div>
  )
}
