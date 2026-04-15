import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function NavBar() {
  const { account, logout } = useAuth()
  const location = useLocation()

  const navLinks = [
    { to: '/session/setup', label: 'New Session' },
    { to: '/history', label: 'History' },
    { to: '/dashboard', label: 'Dashboard' },
  ]

  return (
    <header className="bg-nutreco-blue text-white shadow-md">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/session/setup" className="flex items-center gap-2 font-bold text-lg">
          <span className="bg-white text-nutreco-blue rounded-lg w-8 h-8 flex items-center justify-center text-sm font-extrabold">
            S
          </span>
          SPIN Coach
        </Link>

        <nav className="hidden sm:flex items-center gap-4 text-sm">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1 rounded-lg transition-colors ${
                location.pathname.startsWith(to)
                  ? 'bg-white/20 font-semibold'
                  : 'hover:bg-white/10'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <button
          onClick={logout}
          className="text-blue-200 hover:text-white text-sm transition-colors"
        >
          {account?.name?.split(' ')[0] ?? 'Sign out'} ↗
        </button>
      </div>

      {/* Mobile nav */}
      <nav className="sm:hidden flex border-t border-white/10">
        {navLinks.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 text-center py-2 text-xs font-medium transition-colors ${
              location.pathname.startsWith(to) ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
