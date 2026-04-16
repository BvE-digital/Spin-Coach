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

    if (!isOnline) return

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
        setIsOpen(true)
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

  function handleUseFreeText() {
    if (!query.trim()) return
    const syntheticAccount: D365AccountResult = {
      accountid: `local-${Date.now()}`,
      name: query.trim(),
    }
    setIsOpen(false)
    onSelect(syntheticAccount)
  }

  function handleBlur() {
    setTimeout(() => setIsOpen(false), 150)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && query.trim() && results.length === 0) {
      handleUseFreeText()
    }
  }

  const showFreeTextOption = isOpen && results.length === 0 && query.trim().length >= 2 && !isLoading

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={isOnline ? 'Search customer accounts…' : 'Type customer name (offline)'}
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-nutreco-blue transition-colors bg-gray-50"
          autoComplete="off"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803M10.5 7.5v6m3-3h-6" />
        </svg>
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-nutreco-blue/30 border-t-nutreco-blue rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && (results.length > 0 || showFreeTextOption) && (
        <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-1 overflow-hidden">
          {results.map((acc) => (
            <li key={acc.accountid}>
              <button
                type="button"
                onMouseDown={() => handleSelect(acc)}
                className="w-full text-left px-4 py-3 hover:bg-nutreco-blue/5 text-sm transition-colors flex items-center gap-3"
              >
                <span className="w-7 h-7 rounded-full bg-nutreco-blue/10 text-nutreco-blue text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {acc.name.charAt(0)}
                </span>
                <div>
                  <div className="font-medium text-nutreco-neutral">{acc.name}</div>
                  {acc.telephone1 && (
                    <div className="text-gray-400 text-xs">{acc.telephone1}</div>
                  )}
                </div>
              </button>
            </li>
          ))}
          {showFreeTextOption && (
            <li>
              <button
                type="button"
                onMouseDown={handleUseFreeText}
                className="w-full text-left px-4 py-3 hover:bg-nutreco-blue/5 text-sm transition-colors flex items-center gap-3 border-t border-gray-100"
              >
                <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  +
                </span>
                <div>
                  <div className="font-medium text-nutreco-neutral">Use &ldquo;{query}&rdquo;</div>
                  <div className="text-gray-400 text-xs">Add as manual entry</div>
                </div>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
