import { useRef, useState } from 'react'
import { transcribeService } from '../services/transcribeService'

interface UseSpeechOptions {
  onTranscript: (text: string, isFinal: boolean) => void
  onSubmit: (finalText: string) => void
  onError?: (error: string) => void
  silenceMs?: number
}

export function useSpeech({ onTranscript, onSubmit, onError, silenceMs = 3000 }: UseSpeechOptions) {
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const finalTranscriptRef = useRef('')
  const [isRecording, setIsRecording] = useState(false)

  const isSpeechAPIAvailable =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  function clearSilenceTimer() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  function resetSilenceTimer(onSilence: () => void) {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(onSilence, silenceMs)
  }

  function stopAndSubmit() {
    clearSilenceTimer()
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    } else {
      // Web Speech API path — submit with accumulated transcript
      const text = finalTranscriptRef.current.trim()
      if (text) onSubmit(text)
      finalTranscriptRef.current = ''
      setIsRecording(false)
    }
  }

  async function startWhisperRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      chunksRef.current = []
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setIsRecording(false)
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        try {
          const text = await transcribeService.transcribeAudio(blob)
          onTranscript(text, true)
          onSubmit(text)
        } catch (err) {
          onError?.(err instanceof Error ? err.message : 'Transcription failed')
        }
      }

      recorder.start()
      setIsRecording(true)
      resetSilenceTimer(() => {
        recorder.stop()
      })
    } catch {
      onError?.('Microphone access denied')
    }
  }

  function start() {
    finalTranscriptRef.current = ''

    if (!isSpeechAPIAvailable) {
      void startWhisperRecording()
      return
    }

    const SR = (window.SpeechRecognition ?? (window as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition)!
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-GB'

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      resetSilenceTimer(stopAndSubmit)
      let interim = ''
      let finalText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result[0]) {
          if (result.isFinal) {
            finalText += result[0].transcript
          } else {
            interim += result[0].transcript
          }
        }
      }
      if (finalText) {
        finalTranscriptRef.current += finalText
        onTranscript(finalTranscriptRef.current, true)
      } else if (interim) {
        onTranscript(finalTranscriptRef.current + interim, false)
      }
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        recognition.stop()
        recognitionRef.current = null
        void startWhisperRecording()
      } else {
        onError?.(e.error)
        setIsRecording(false)
      }
    }

    recognition.onend = () => {
      // If ended without explicit stop (e.g. network), submit what we have
      if (finalTranscriptRef.current.trim()) {
        onSubmit(finalTranscriptRef.current.trim())
        finalTranscriptRef.current = ''
      }
      setIsRecording(false)
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
    resetSilenceTimer(stopAndSubmit)
  }

  function stop() {
    stopAndSubmit()
  }

  return { start, stop, isRecording, isSpeechAPIAvailable }
}
