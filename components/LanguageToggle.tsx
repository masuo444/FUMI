'use client'
import { useRouter } from 'next/navigation'
import type { Lang } from '@/lib/i18n'

export function LanguageToggle({ lang }: { lang: Lang }) {
  const router = useRouter()

  function toggle() {
    const next = lang === 'ja' ? 'en' : 'ja'
    document.cookie = `fumi_lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}`
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      className="text-xs font-medium px-2 py-1 border border-current rounded opacity-60 hover:opacity-100 transition-opacity tracking-wide"
    >
      {lang === 'ja' ? 'EN' : 'JA'}
    </button>
  )
}
