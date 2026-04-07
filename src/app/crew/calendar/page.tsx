'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { CalendarView, type CalendarTask } from '@/components/calendar/CalendarView'

// Em produção viria da sessão autenticada
const DEMO_CREW_ID = 'demo-crew-id'

export default function CrewCalendarPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [tasks, setTasks] = useState<CalendarTask[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCalendar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ month, crewId: DEMO_CREW_ID })
    const res = await fetch(`/api/crew/calendar?${params}`)
    const json = await res.json()

    const mapped: CalendarTask[] = (json.tasks ?? []).map((t: {
      id: string; title: string; type: string; status: string; dueDate: string;
      assignee: { id: string; name: string };
      property: { id: string; name: string };
      checklistItems: { completed: boolean }[]
    }) => ({
      id: t.id,
      title: t.title,
      type: t.type as never,
      status: t.status as never,
      dueDate: t.dueDate,
      assigneeName: t.assignee.name,
      propertyName: t.property.name,
      checklistDone: t.checklistItems.filter((ci: { completed: boolean }) => ci.completed).length,
      checklistTotal: t.checklistItems.length,
    }))

    setTasks(mapped)
    setLoading(false)
  }, [month])

  useEffect(() => { fetchCalendar() }, [fetchCalendar])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Minhas Tarefas</h1>
            <p className="text-sm text-gray-500">Calendário da equipe</p>
          </div>
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">← Início</a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading && (
          <div className="text-center text-sm text-gray-400 mb-4">Carregando...</div>
        )}
        <CalendarView
          tasks={tasks}
          onMonthChange={setMonth}
          onTaskUpdated={fetchCalendar}
          canReassign={false}
        />
      </main>
    </div>
  )
}
