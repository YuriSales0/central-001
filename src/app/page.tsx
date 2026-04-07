import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Central</h1>
        <p className="text-gray-500 mt-2">Plataforma de gestão de propriedades</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
        <Link
          href="/admin/calendar"
          className="flex flex-col items-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
        >
          <span className="text-2xl mb-2">🗓️</span>
          <span className="font-semibold text-gray-800">Admin</span>
          <span className="text-xs text-gray-500 mt-0.5">Calendário geral</span>
        </Link>

        <Link
          href="/manager/calendar"
          className="flex flex-col items-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all"
        >
          <span className="text-2xl mb-2">👔</span>
          <span className="font-semibold text-gray-800">Manager</span>
          <span className="text-xs text-gray-500 mt-0.5">Suas propriedades</span>
        </Link>

        <Link
          href="/crew/calendar"
          className="flex flex-col items-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-green-300 transition-all"
        >
          <span className="text-2xl mb-2">🔧</span>
          <span className="font-semibold text-gray-800">Crew</span>
          <span className="text-xs text-gray-500 mt-0.5">Minhas tarefas</span>
        </Link>
      </div>
    </main>
  )
}
