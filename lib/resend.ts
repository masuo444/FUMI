import { Resend } from 'resend'
import { Member, Post, PostTranslation, OwnerSenderAddress } from '@/types'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const DEFAULT_FROM_NAME = process.env.RESEND_FROM_NAME ?? 'Fumi'
const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

/** HTML special chars をエスケープ。メール本文への直接挿入に必須 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Markdown 記法・画像を除去してプレーンテキストの冒頭 maxChars 文字を返す */
function getExcerpt(body: string, maxChars = 200): string {
  const plain = body
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → text only
    .replace(/#{1,6}\s/g, '') // headings
    .replace(/[*_~`]/g, '') // bold/italic/code markers
    .trim()
  return plain.length > maxChars ? plain.slice(0, maxChars) + '…' : plain
}

/**
 * 件名フォーマット
 * JA: 【サロン名】記事タイトル
 * EN: [Salon Name] Article Title
 */
function buildSubject(salonName: string, title: string, lang: 'ja' | 'en'): string {
  return lang === 'ja'
    ? `【${salonName}】${title}`
    : `[${salonName}] ${title}`
}

function buildEmailHtml(params: {
  salonName: string
  title: string
  excerpt: string
  articleUrl: string
  lang: 'ja' | 'en'
}): string {
  const { salonName, title, excerpt, articleUrl, lang } = params
  const isJa = lang === 'ja'

  // escapeHtml でXSS防止。articleUrl はサーバー内部生成なのでエスケープ不要
  const safeSalonName = escapeHtml(salonName)
  const safeTitle = escapeHtml(title)
  const safeExcerpt = escapeHtml(excerpt)

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
  <p style="font-size:12px;color:#999;margin:0 0 16px;">
    ${isJa ? `${safeSalonName} からの新着記事` : `New article from ${safeSalonName}`}
  </p>
  <h2 style="font-size:20px;margin:0 0 8px;">${safeTitle}</h2>
  <p style="color:#555;line-height:1.6;margin:0 0 24px;">${safeExcerpt}</p>
  <a href="${articleUrl}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;font-size:14px;">
    ${isJa ? '続きを読む →' : 'Read more →'}
  </a>
  <hr style="margin-top:32px;border:none;border-top:1px solid #eee;">
  <p style="font-size:12px;color:#999;margin-top:16px;">
    ${isJa
      ? `このメールは ${safeSalonName} の新着記事通知です。`
      : `This is a new article notification from ${safeSalonName}.`}
  </p>
</body>
</html>`
}

export async function sendArticleNotification(params: {
  member: Member
  post: Post
  translations: PostTranslation[]
  salonId: string
  salonName: string
  senderAddress?: OwnerSenderAddress | null
  /** サロン設定で言語を固定する場合に指定。未指定なら member.preferred_language を使う */
  overrideLang?: 'ja' | 'en'
}): Promise<{ success: boolean; error?: string }> {
  const { member, post, translations, salonId, salonName, senderAddress, overrideLang } = params

  // 言語優先順: overrideLang（サロン固定）> member.preferred_language > 他言語フォールバック
  // status:'failed' / 'pending_insufficient_balance' のレコードは使わない
  const preferred = overrideLang ?? member.preferred_language
  const translation =
    translations.find((t) => t.language_code === preferred && t.status === 'completed') ??
    translations.find((t) => t.status === 'completed')

  if (!translation) return { success: false, error: 'No completed translation available' }

  const lang = translation.language_code as 'ja' | 'en'
  const articleUrl = `${APP_URL}/salon/${salonId}/${post.id}`
  const excerpt = getExcerpt(translation.body)

  const fromName = senderAddress?.from_name ?? DEFAULT_FROM_NAME
  const fromEmail = senderAddress?.from_email ?? DEFAULT_FROM_EMAIL
  const replyTo = senderAddress?.reply_to_email ?? undefined

  try {
    const resend = getResend()
    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: member.email,
      replyTo,
      subject: buildSubject(salonName, translation.title, lang),
      html: buildEmailHtml({
        salonName,
        title: translation.title,
        excerpt,
        articleUrl,
        lang,
      }),
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
