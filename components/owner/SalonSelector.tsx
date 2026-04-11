'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Salon } from '@/types'

// サロン選択状態を URL クエリ ?salon=xxx で管理する。
// localStorage は使わず、SSR でも searchParams から読める。

export function SalonSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSalonId = searchParams.get('salon') ?? ''

  const [salons, setSalons] = useState<Salon[]>([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [selected, setSelected] = useState(currentSalonId)

  // サロン一覧を API から取得
  useEffect(() => {
    fetch('/api/salons')
      .then((r) => r.json())
      .then((data: Salon[]) => {
        if (!Array.isArray(data) || data.length === 0) return
        setSalons(data)
        // URL に salon が指定されていなければ先頭を選択
        if (!currentSalonId) {
          pushSalon(data[0].id, data[0].id)
        } else {
          setSelected(currentSalonId)
        }
      })
      .catch(() => {/* ignore */})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // URL を更新するヘルパー
  const pushSalon = useCallback(
    (id: string, initialSelected?: string) => {
      setSelected(initialSelected ?? id)
      const params = new URLSearchParams(searchParams.toString())
      params.set('salon', id)
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  async function createSalon() {
    if (!newName.trim()) return
    const res = await fetch('/api/salons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (res.ok) {
      const salon: Salon = await res.json()
      setSalons((prev) => [...prev, salon])
      pushSalon(salon.id)
      setNewName('')
      setCreating(false)
    }
  }

  if (creating) {
    return (
      <div className="px-3 py-2 border-b border-gray-200">
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createSalon()}
          placeholder="サロン名"
          className="w-full text-sm border border-gray-300 rounded px-2 py-1 mb-1"
        />
        <div className="flex gap-1">
          <button onClick={createSalon} className="text-xs text-white bg-gray-900 px-2 py-1 rounded">
            作成
          </button>
          <button onClick={() => setCreating(false)} className="text-xs text-gray-500 px-2 py-1">
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 border-b border-gray-200">
      <label className="text-xs text-gray-500 mb-1 block">サロン</label>
      <select
        value={selected}
        onChange={(e) => pushSalon(e.target.value)}
        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
      >
        {salons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      {salons.length === 0 && (
        <button onClick={() => setCreating(true)} className="mt-1 text-xs text-gray-500 hover:text-gray-700">
          + サロンを追加
        </button>
      )}
    </div>
  )
}
