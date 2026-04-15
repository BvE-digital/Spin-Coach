export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div
      className={`${sizes[size]} border-4 border-nutreco-blue/20 border-t-nutreco-blue rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-nutreco-neutral text-sm">Loading…</p>
      </div>
    </div>
  )
}
