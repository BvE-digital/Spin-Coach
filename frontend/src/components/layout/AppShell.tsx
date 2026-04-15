import { Outlet } from 'react-router-dom'
import { NavBar } from './NavBar'
import { OfflineBanner } from './OfflineBanner'
import { useOfflineQueue } from '../../db/offlineQueue'
import { Toaster } from 'react-hot-toast'

export function AppShell() {
  // Auto-syncs pending sessions when connectivity is restored
  useOfflineQueue()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <OfflineBanner />
      <NavBar />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif' },
        }}
      />
    </div>
  )
}
