'use client'

import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircle, Lock } from 'lucide-react'
import { clsx } from 'clsx'

export interface ConversationPreview {
  id: string
  subject: string | null
  updatedAt: string
  client:  { id: string; name: string; email: string; avatar: string | null }
  manager: { id: string; name: string; email: string; avatar: string | null }
  messages: { content: string; sender: { id: string; name: string }; createdAt: string }[]
  _count: { messages: number }  // não lidas
  readOnly?: boolean             // se o utilizador atual não pode responder
}

interface Props {
  conversations: ConversationPreview[]
  selectedId: string | null
  currentUserId: string
  onSelect: (id: string) => void
}

function formatTime(iso: string) {
  const d = new Date(iso)
  if (isToday(d))     return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Ontem'
  return format(d, 'd MMM', { locale: ptBR })
}

function Avatar({ name, avatar, size = 8 }: { name: string; avatar?: string | null; size?: number }) {
  if (avatar) return (
    <img src={avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />
  )
  return (
    <div className={`w-${size} h-${size} rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600 font-semibold text-xs`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function ConversationList({ conversations, selectedId, currentUserId, onSelect }: Props) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4 text-center">
        <MessageCircle size={32} className="mb-2 opacity-30" />
        <p className="text-sm">Nenhuma conversa ainda</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 overflow-y-auto h-full">
      {conversations.map((conv) => {
        const isSelected = conv.id === selectedId
        const lastMsg = conv.messages[0]
        const unread = conv._count.messages
        const isReadOnly = conv.readOnly

        // Nome a mostrar: client vê manager, manager/admin vê client
        const otherParty =
          currentUserId === conv.client.id ? conv.manager : conv.client

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={clsx(
              'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors',
              isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
            )}
          >
            <Avatar name={otherParty.name} avatar={otherParty.avatar} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className={clsx('text-sm truncate', unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700')}>
                  {otherParty.name}
                </span>
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  {lastMsg ? formatTime(lastMsg.createdAt) : formatTime(conv.updatedAt)}
                </span>
              </div>

              {conv.subject && (
                <p className="text-[10px] text-gray-400 truncate">{conv.subject}</p>
              )}

              <div className="flex items-center gap-1 mt-0.5">
                {isReadOnly && <Lock size={9} className="text-gray-300 flex-shrink-0" />}
                <p className={clsx('text-xs truncate', unread > 0 ? 'text-gray-700' : 'text-gray-400')}>
                  {lastMsg
                    ? `${lastMsg.sender.id === currentUserId ? 'Você: ' : ''}${lastMsg.content}`
                    : 'Sem mensagens'}
                </p>
              </div>
            </div>

            {unread > 0 && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
