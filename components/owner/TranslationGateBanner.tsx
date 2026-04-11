import Link from 'next/link'
import type { Lang } from '@/lib/i18n'

const copy = {
  ja: {
    title: '翻訳機能はProプランで利用できます',
    body: 'トライアル中は記事の公開・メール配信が使えます。他言語への自動翻訳はProプラン（$10/月）にアップグレードすると有効になります。',
    cta: 'Proにアップグレード →',
  },
  en: {
    title: 'Auto-translation requires the Pro plan',
    body: 'During your trial, you can publish posts and deliver emails. Auto-translation to other languages is available on the Pro plan ($10/month).',
    cta: 'Upgrade to Pro →',
  },
}

export function TranslationGateBanner({ isPro, lang }: { isPro: boolean; lang: Lang }) {
  if (isPro) return null

  const t = copy[lang]

  return (
    <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <span className="text-amber-500 text-lg shrink-0 mt-0.5">⚠</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800 mb-1">{t.title}</p>
        <p className="text-xs text-amber-700 leading-relaxed">{t.body}</p>
      </div>
      <Link
        href="/billing"
        className="shrink-0 px-3 py-1.5 text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors rounded whitespace-nowrap"
      >
        {t.cta}
      </Link>
    </div>
  )
}
