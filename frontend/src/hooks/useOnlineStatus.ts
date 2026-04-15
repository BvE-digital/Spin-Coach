import { useEffect } from 'react'
import { useUIStore } from '../store/uiStore'

export function useOnlineStatus(): boolean {
  const { isOnline, setOnline } = useUIStore()

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])

  return isOnline
}
