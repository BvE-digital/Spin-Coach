import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const DEMO_MODE = !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === ''

const navLinks = [
  {
    to: '/session/setup',
    label: 'Session',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    to: '/history',
    label: 'History',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
]

export function NavBar() {
  const { account, logout } = useAuth()
  const location = useLocation()

  return (
    <header className="bg-nutreco-blue text-white">
      {/* Top bar */}
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/session/setup" className="flex items-center gap-2.5 font-bold text-base">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-nutreco-blue" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" />
            </svg>
          </div>
          <span className="tracking-tight">SPIN Coach</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ to, label, icon }) => {
            const active = location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-white/20' : 'hover:bg-white/10 text-blue-200 hover:text-white'
                }`}
              >
                {icon}
                {label}
              </Link>
            )
          })}
        </nav>

        {DEMO_MODE ? (
          <span className="text-blue-300 text-xs bg-white/10 px-2.5 py-1 rounded-full font-medium">
            Demo
          </span>
        ) : (
          <button
            onClick={logout}
            className="text-blue-200 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
          >
            {account?.name?.split(' ')[0] ?? 'Sign out'}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden flex border-t border-white/10">
        {navLinks.map(({ to, label, icon }) => {
          const active = location.pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                active ? 'bg-white/20 text-white' : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              {icon}
              {label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
