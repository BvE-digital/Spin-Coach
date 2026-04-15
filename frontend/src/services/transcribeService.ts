import { apiClient } from './apiClient'

export const transcribeService = {
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    const res = await apiClient.post<{ transcript: string }>('/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    })
    return res.data.transcript
  },
}
