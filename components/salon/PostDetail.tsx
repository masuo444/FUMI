'use client'
import { useState } from 'react'
import Link from 'next/link'
import { PostTranslation, PostImage, LanguageCode } from '@/types'
import { formatDate } from '@/lib/utils'

interface Props {
  translations: PostTranslation[]
  publishedAt: string
  images: PostImage[]
  salonPaymentUrl: string | null
  isMember: boolean
  salonId: string
}

const TEASER_CHARS = 200

export function PostDetail({ translations, publishedAt, images, salonPaymentUrl, isMember, salonId }: Props) {
  const available = translations.filter((t) => t.status === 'completed')
  const defaultLang: LanguageCode = available.find((t) => t.language_code === 'ja')
    ? 'ja'
    : available[0]?.language_code ?? 'ja'

  const [lang, setLang] = useState<LanguageCode>(defaultLang)

  const current = available.find((t) => t.language_code === lang) ?? available[0]

  if (!current) {
    return (
      <p className="text-center py-20 text-sm text-[#6B6B6B]">
        記事が見つかりません
      </p>
    )
  }

  const isJa = lang === 'ja'
  const bodyText = current.body
  const showFull = isMember
  const teaserText =
    bodyText.length > TEASER_CHARS ? bodyText.slice(0, TEASER_CHARS) + '…' : bodyText

  return (
    <article>
      {/* Language switcher — clean tabs */}
      {available.length > 1 && (
        <div className="flex items-center gap-1 mb-8 p-1 rounded-xl bg-[#F9F9F9] border border-[#E5E5E5] w-fit">
          {available.map((t) => (
            <button
              key={t.language_code}
              onClick={() => setLang(t.language_code)}
              className={[
                'px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150',
                lang === t.language_code
                  ? 'bg-white text-[#111111] shadow-sm border border-[#E5E5E5]'
                  : 'text-[#6B6B6B] hover:text-[#111111]',
              ].join(' ')}
            >
              {t.language_code === 'ja' ? '日本語' : 'English'}
            </button>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-[#111111] mb-4">
        {current.title}
      </h1>

      {/* Date */}
      <p className="text-xs font-medium text-[#6B6B6B] mb-8">
        {formatDate(publishedAt, lang)}
      </p>

      {/* Divider */}
      <div className="mb-8 h-px bg-[#E5E5E5]" />

      {/* Body */}
      {showFull ? (
        <>
          <div
            className="text-[17px] leading-[1.85] whitespace-pre-wrap text-[#111111]"
            style={{
              fontFeatureSettings: '"palt"',
              wordBreak: 'break-all',
              overflowWrap: 'break-word',
            }}
          >
            {bodyText}
          </div>

          {images.length > 0 && (
            <div className="mt-10 flex flex-col gap-5">
              {images
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((img) => (
                  <img
                    key={img.id}
                    src={img.image_url}
                    alt=""
                    className="rounded-xl max-w-full border border-[#E5E5E5]"
                  />
                ))}
            </div>
          )}

          {/* CTA at bottom — Substack style */}
          {salonPaymentUrl && (
            <div className="mt-16 pt-10 border-t border-[#E5E5E5]">
              <div className="rounded-2xl border border-[#E5E5E5] bg-[#F9F9F9] p-8 text-center">
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4F6AF5] mb-3">
                  {isJa ? 'このサロンを応援する' : 'Support this salon'}
                </p>
                <h3 className="text-lg font-bold text-[#111111] tracking-tight mb-2">
                  {isJa ? 'コンテンツが気に入りましたか？' : 'Enjoying the content?'}
                </h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6 max-w-xs mx-auto">
                  {isJa
                    ? '会員になってすべての記事をご覧いただけます'
                    : 'Become a member to access all articles'}
                </p>
                <a
                  href={salonPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold rounded-full bg-[#4F6AF5] text-white hover:bg-[#3d58e3] transition-colors"
                >
                  {isJa ? '会員登録・決済はこちら' : 'Join & Subscribe'}
                  <span>→</span>
                </a>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Teaser with fade */}
          <div className="relative">
            <div
              className="text-[17px] leading-[1.85] whitespace-pre-wrap text-[#111111]"
              style={{
                fontFeatureSettings: '"palt"',
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
              }}
            >
              {teaserText}
            </div>
            {/* Fade overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
          </div>

          {/* Paywall card — clean Substack style */}
          <div className="mt-8 rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm">
            {/* Top accent */}
            <div className="h-1 bg-[#4F6AF5]" />

            <div className="p-8 sm:p-10 text-center">
              {/* Lock icon */}
              <div className="w-12 h-12 rounded-full bg-[#F0F2FF] flex items-center justify-center mx-auto mb-5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F6AF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4F6AF5] mb-3">
                Members Only
              </p>
              <h3 className="text-xl font-bold text-[#111111] tracking-tight mb-2">
                {isJa ? '続きを読むには会員ログインが必要です' : 'Login required to read more'}
              </h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed mb-8 max-w-xs mx-auto">
                {isJa
                  ? '会員の方はメールアドレスでワンクリックでログインできます'
                  : 'Members can log in instantly with their email address'}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={`/salon/${salonId}/login`}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold rounded-full bg-[#4F6AF5] text-white hover:bg-[#3d58e3] transition-colors"
                >
                  {isJa ? '会員ログイン' : 'Member Login'}
                  <span>→</span>
                </Link>
                {salonPaymentUrl && (
                  <a
                    href={salonPaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold rounded-full border border-[#E5E5E5] text-[#6B6B6B] hover:border-[#4F6AF5] hover:text-[#4F6AF5] transition-colors"
                  >
                    {isJa ? '会員登録はこちら' : 'Become a member'}
                  </a>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </article>
  )
}
