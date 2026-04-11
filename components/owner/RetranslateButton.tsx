'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { LanguageCode } from '@/types'

interface Props {
  postId: string
  targetLang: LanguageCode
}

export function RetranslateButton({ postId, targetLang }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function retranslate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/posts/${postId}/retranslate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 402) {
          setError(
            `残高不足（必要: ${formatCurrency(data.required)}、現在: ${formatCurrency(data.current_balance)}）`
          )
        } else {
          setError(data.error ?? 'エラーが発生しました')
        }
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="secondary" onClick={retranslate} loading={loading}>
        {targetLang.toUpperCase()} 再翻訳
      </Button>
      {error && <p className="text-xs text-red-600 max-w-[160px] text-right">{error}</p>}
    </div>
  )
}
