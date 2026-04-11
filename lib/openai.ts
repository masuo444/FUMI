import OpenAI from 'openai'
import { LanguageCode, TRANSLATION_COST_PER_CHAR } from '@/types'

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  ja: '日本語',
  en: 'English',
}

export function estimateTranslationCost(text: string): number {
  return Math.ceil(text.length * TRANSLATION_COST_PER_CHAR)
}

export async function translateText(
  text: string,
  fromLang: LanguageCode,
  toLang: LanguageCode
): Promise<string> {
  const openai = getClient()
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the following text from ${LANGUAGE_NAMES[fromLang]} to ${LANGUAGE_NAMES[toLang]}. Preserve formatting such as line breaks and markdown. Output only the translated text, nothing else.`,
      },
      {
        role: 'user',
        content: text,
      },
    ],
    temperature: 0.2,
  })
  return response.choices[0].message.content ?? ''
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
