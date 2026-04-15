import Anthropic from '@anthropic-ai/sdk'
import { SPIN_DEBRIEF_PROMPT, SPIN_EXTRACT_PROMPT } from '../prompts/spinPrompt.js'
import { env } from '../config/env.js'
import type { ChatMessage, SessionContext, SpinExtraction } from '../types/session.js'

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

export const claudeClient = {
  streamChat(messages: ChatMessage[], sessionContext: SessionContext) {
    const systemPrompt = SPIN_DEBRIEF_PROMPT.replace(
      '{sessionContext}',
      JSON.stringify(sessionContext, null, 2)
    )
    return anthropic.messages.stream({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })
  },

  async extractSpinData(transcript: string): Promise<SpinExtraction> {
    const response = await anthropic.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 2048,
      system: SPIN_EXTRACT_PROMPT,
      messages: [{ role: 'user', content: `Session transcript:\n\n${transcript}` }],
    })
    const block = response.content[0]
    if (block.type !== 'text') throw new Error('Unexpected content type from Claude')
    // Strip any accidental markdown fences before parsing
    const cleaned = block.text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    return JSON.parse(cleaned) as SpinExtraction
  },
}
