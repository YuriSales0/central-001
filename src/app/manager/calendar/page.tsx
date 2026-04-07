'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { CalendarView, type CalendarTask } from '@/components/calendar/CalendarView'

// Em produção isso viria da sessão autenticada
const DEMO_MANAGER_ID = 'demo-manager-id'

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
  allManagers: { id: string; name: string }[]
  currentManagerId: string
}

export default function ManagerCalendarPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [managerId, setManagerId] = useState(DEMO_MANAGER_ID)
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCalendar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ month, managerId })
    if (propertyId) params.set('propertyId', propertyId)
    const res = await fetch(`/api/manager/calendar?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [month, managerId, propertyId])

  useEffect(() => { fetchCalendar() }, [fetchCalendar])

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
            <h1 className="text-xl font-bold text-gray-900">Calendário — Manager</h1>
            <p className="text-sm text-gray-500">Suas propriedades</p>
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
          properties={data?.properties}
          onPropertyFilter={setPropertyId}
          allManagers={data?.allManagers}
          currentManagerId={data?.currentManagerId ?? managerId}
          onManagerSwitch={(id) => {
            setManagerId(id)
            setPropertyId(null)
          }}
        />
      </main>
    </div>
  )
}
