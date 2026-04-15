import { useState, useRef, useEffect } from 'react'
import { d365Service } from '../../services/d365Service'
import type { D365AccountResult } from '../../types/d365'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

interface Props {
  value: string
  onSelect: (account: D365AccountResult) => void
}

export function CustomerSearch({ value, onSelect }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<D365AccountResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isOnline = useOnlineStatus()

  useEffect(() => {
    setQuery(value)
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)

    if (!isOnline) return // offline: free-text only, no search

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (q.length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }
      setIsLoading(true)
      try {
        const accounts = await d365Service.searchAccounts(q)
        setResults(accounts)
        setIsOpen(accounts.length > 0)
      } catch {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }

  function handleSelect(account: D365AccountResult) {
    setQuery(account.name)
    setIsOpen(false)
    onSelect(account)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder={isOnline ? 'Search customer accounts…' : 'Enter customer name (offline)'}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-nutreco-blue transition-colors"
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-nutreco-blue/30 border-t-nutreco-blue rounded-full animate-spin" />
        </div>
      )}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
          {results.map((acc) => (
            <li key={acc.accountid}>
              <button
                type="button"
                onMouseDown={() => handleSelect(acc)}
                className="w-full text-left px-4 py-3 hover:bg-nutreco-blue/5 text-sm transition-colors"
              >
                <div className="font-medium text-nutreco-neutral">{acc.name}</div>
                {acc.telephone1 && (
                  <div className="text-gray-400 text-xs mt-0.5">{acc.telephone1}</div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
