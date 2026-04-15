import OpenAI from 'openai'
import { env } from '../config/env.js'

let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured for Whisper fallback')
    openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
  }
  return openai
}

export const transcribeClient = {
  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
    const client = getOpenAI()
    // Convert Buffer to a File-like object that OpenAI SDK accepts
    const file = new File([audioBuffer], filename, { type: 'audio/webm' })
    const result = await client.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      language: 'en',
    })
    return result.text
  },
}
