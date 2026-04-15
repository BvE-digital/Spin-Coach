interface Props {
  isRecording: boolean
  isDisabled?: boolean
  onClick: () => void
}

export function MicButton({ isRecording, isDisabled, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      className={`
        w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl
        focus:outline-none focus:ring-4 focus:ring-nutreco-magenta/40
        disabled:opacity-40 disabled:pointer-events-none
        ${
          isRecording
            ? 'bg-nutreco-magenta scale-110 animate-pulse'
            : 'bg-nutreco-blue hover:bg-nutreco-blue/90 hover:scale-105'
        }
      `}
    >
      {isRecording ? (
        // Stop icon
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        // Mic icon
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" />
        </svg>
      )}
    </button>
  )
}
