import Anthropic from '@anthropic-ai/sdk'
import { LanguageCode, TRANSLATION_COST_PER_CHAR } from '@/types'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  ja: 'Japanese',
  en: 'English',
}

/** クレジット消費量の見積もり（翻訳前に引き落とす） */
export function estimateTranslationCost(text: string): number {
  return Math.ceil(text.length * TRANSLATION_COST_PER_CHAR)
}

export async function translateText(
  text: string,
  fromLang: LanguageCode,
  toLang: LanguageCode
): Promise<string> {
  const client = getClient()
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Translate the following text from ${LANGUAGE_NAMES[fromLang]} to ${LANGUAGE_NAMES[toLang]}. Preserve all formatting including line breaks and markdown. Output only the translated text, nothing else.\n\n${text}`,
      },
    ],
  })

  const block = message.content[0]
  return block.type === 'text' ? block.text : ''
}

export async function translatePost(params: {
  title: string
  body: string
  fromLang: LanguageCode
  toLang: LanguageCode
}): Promise<{ title: string; body: string }> {
  const [translatedTitle, translatedBody] = await Promise.all([
    translateText(params.title, params.fromLang, params.toLang),
    translateText(params.body, params.fromLang, params.toLang),
  ])
  return { title: translatedTitle, body: translatedBody }
}
