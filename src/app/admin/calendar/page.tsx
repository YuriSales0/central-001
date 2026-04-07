'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { CalendarView, type CalendarTask } from '@/components/calendar/CalendarView'

interface ApiResponse {
  tasks: {
    id: string
    title: string
    type: string
    status: string
    dueDate: string
    assignee: { id: string; name: string }
    property: { id: string; name: string }
    checklistItems: { completed: boolean }[]
  }[]
  properties: { id: string; name: string }[]
}

export default function AdminCalendarPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [crewList, setCrewList] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCalendar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ month })
    if (propertyId) params.set('propertyId', propertyId)
    const res = await fetch(`/api/admin/calendar?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [month, propertyId])

  useEffect(() => { fetchCalendar() }, [fetchCalendar])

  useEffect(() => {
    fetch('/api/admin/crew')
      .then((r) => r.json())
      .then(setCrewList)
      .catch(() => {})
  }, [])

  const tasks: CalendarTask[] = (data?.tasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    type: t.type as never,
    status: t.status as never,
    dueDate: t.dueDate,
    assigneeName: t.assignee.name,
    propertyName: t.property.name,
    checklistDone: t.checklistItems.filter((ci) => ci.completed).length,
    checklistTotal: t.checklistItems.length,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Calendário — Admin</h1>
            <p className="text-sm text-gray-500">Todas as propriedades e tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700">← Início</a>
          </div>
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
          canReassign
          crewList={crewList}
          properties={data?.properties}
          onPropertyFilter={setPropertyId}
        />
      </main>
    </div>
  )
}
