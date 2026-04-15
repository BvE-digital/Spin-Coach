import { useOnlineStatus } from '../../hooks/useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  if (isOnline) return null
  return (
    <div className="bg-nutreco-orange text-white text-sm font-medium text-center py-2 px-4">
      You are offline — sessions will be saved and synced when you reconnect.
    </div>
  )
}
