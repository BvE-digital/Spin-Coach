export function useTTS() {
  function speak(text: string, onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-GB'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    // Prefer a locally installed voice for reliability in offline/standalone PWA mode
    const voices = window.speechSynthesis.getVoices()
    const localVoice = voices.find((v) => v.localService && v.lang.startsWith('en'))
    utterance.voice = localVoice ?? null
    if (onEnd) utterance.onend = onEnd
    window.speechSynthesis.speak(utterance)
  }

  function cancel(): void {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }

  const isAvailable = 'speechSynthesis' in window

  return { speak, cancel, isAvailable }
}
