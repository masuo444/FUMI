'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Member, PreferredLanguage } from '@/types'
import { formatDate } from '@/lib/utils'

// ─── 型 ──────────────────────────────────────────────────────
interface Props {
  salons: Array<{ id: string; name: string }>
  defaultSalonId?: string
}

// ─── メインコンポーネント ─────────────────────────────────────
export function MembersClient({ salons, defaultSalonId }: Props) {
  const router = useRouter()

  // ── 選択サロン ──
  const [salonId, setSalonId] = useState(defaultSalonId ?? salons[0]?.id ?? '')

  // ── 一覧 ──
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')

  // ── 検索 ──
  const [search, setSearch] = useState('')

  // ── 追加フォーム ──
  const [showAdd, setShowAdd] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addName, setAddName] = useState('')
  const [addLang, setAddLang] = useState<PreferredLanguage>('ja')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  // ── 編集 ──
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editLang, setEditLang] = useState<PreferredLanguage>('ja')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // ── CSV ──
  const [showCsv, setShowCsv] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvResult, setCsvResult] = useState<{ success: number; errors: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── 成功メッセージ ──
  const [successMsg, setSuccessMsg] = useState('')
  function flash(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  // ─────────────────────────────────────────────────────────
  // サロン切替：URL クエリも更新して SalonSelector と同期
  // ─────────────────────────────────────────────────────────
  function handleSalonChange(newId: string) {
    setSalonId(newId)
    setEditingId(null)
    setShowAdd(false)
    setShowCsv(false)
    setSearch('')
    const params = new URLSearchParams(window.location.search)
    params.set('salon', newId)
    router.replace(`/members?${params.toString()}`)
  }

  // ─────────────────────────────────────────────────────────
  // 会員一覧取得
  // useCallback で salonId が変わるたびに新しい関数を生成し、
  // クロージャ由来の古い salonId 参照を防ぐ
  // ─────────────────────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    if (!salonId) return
    setLoading(true)
    setFetchError('')
    try {
      const res = await fetch(`/api/members?salon_id=${salonId}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to fetch members')
      }
      setMembers(await res.json())
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [salonId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // ─────────────────────────────────────────────────────────
  // 追加
  // ─────────────────────────────────────────────────────────
  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setAddError('')
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salon_id: salonId,
        email: addEmail.trim(),
        name: addName.trim() || undefined,
        preferred_language: addLang,
      }),
    })
    if (res.ok) {
      const m: Member = await res.json()
      setMembers((prev) => [m, ...prev])
      setAddEmail('')
      setAddName('')
      setShowAdd(false)
      flash('会員を追加しました')
    } else {
      const json = await res.json().catch(() => ({}))
      setAddError(json.error ?? '追加に失敗しました')
    }
    setAdding(false)
  }

  // ─────────────────────────────────────────────────────────
  // 編集開始 / 保存 / キャンセル
  // ─────────────────────────────────────────────────────────
  function startEdit(m: Member) {
    setEditingId(m.id)
    setEditName(m.name ?? '')
    setEditLang(m.preferred_language)
    setEditError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError('')
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setEditError('')
    const res = await fetch(`/api/members?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName.trim() || null,
        preferred_language: editLang,
      }),
    })
    if (res.ok) {
      const updated: Member = await res.json()
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)))
      setEditingId(null)
      flash('更新しました')
    } else {
      const json = await res.json().catch(() => ({}))
      setEditError(json.error ?? '更新に失敗しました')
    }
    setSaving(false)
  }

  // ─────────────────────────────────────────────────────────
  // ステータス切替（楽観的更新 + 失敗時リバート）
  // ─────────────────────────────────────────────────────────
  async function toggleStatus(member: Member) {
    const next = member.status === 'active' ? 'inactive' : 'active'
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, status: next } : m)))
    const res = await fetch(`/api/members?id=${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (!res.ok) {
      // 失敗したら元に戻す
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, status: member.status } : m))
      )
    }
  }

  // ─────────────────────────────────────────────────────────
  // 削除（楽観的更新 + 失敗時リバート）
  // ─────────────────────────────────────────────────────────
  async function deleteMember(id: string) {
    if (!confirm('この会員を削除しますか？')) return
    const snapshot = members.find((m) => m.id === id)
    setMembers((prev) => prev.filter((m) => m.id !== id))
    const res = await fetch(`/api/members?id=${id}`, { method: 'DELETE' })
    if (!res.ok && snapshot) {
      setMembers((prev) => [snapshot, ...prev.filter((m) => m.id !== id)])
    }
  }

  // ─────────────────────────────────────────────────────────
  // CSV インポート
  // ─────────────────────────────────────────────────────────
  async function importCsv() {
    if (!csvText.trim()) return
    setCsvLoading(true)
    setCsvResult(null)
    const res = await fetch('/api/members/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salon_id: salonId, csv: csvText }),
    })
    const result = await res.json().catch(() => ({ error: '不明なエラー' }))
    if (res.ok) {
      setCsvResult(result)
      setCsvText('')
      if (fileRef.current) fileRef.current.value = ''
      await fetchMembers() // 再取得で一覧を最新化
    } else {
      setCsvResult({ success: 0, errors: [result.error ?? 'インポートに失敗しました'] })
    }
    setCsvLoading(false)
  }

  function handleFileLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCsvText((ev.target?.result as string) ?? '')
    reader.readAsText(file, 'UTF-8')
  }

  // ─────────────────────────────────────────────────────────
  // 算出値
  // ─────────────────────────────────────────────────────────
  const filtered = members.filter((m) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      m.email.toLowerCase().includes(q) ||
      (m.name?.toLowerCase().includes(q) ?? false)
    )
  })
  const activeCount = members.filter((m) => m.status === 'active').length

  // ─────────────────────────────────────────────────────────
  // サロンなし
  // ─────────────────────────────────────────────────────────
  if (salons.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
        まずサイドバーの「+ サロンを追加」からサロンを作成してください
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── ヘッダ行 ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* サロン選択 */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">サロン</label>
          <select
            value={salonId}
            onChange={(e) => handleSalonChange(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
          >
            {salons.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-400">
          アクティブ {activeCount} / 合計 {members.length}
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            onClick={() => { setShowAdd((v) => !v); setShowCsv(false) }}
          >
            + 1件追加
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => { setShowCsv((v) => !v); setShowAdd(false) }}
          >
            CSV 一括
          </Button>
        </div>
      </div>

      {/* ── 全体メッセージ ────────────────────────────────── */}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}
      {fetchError && <Alert variant="danger">{fetchError}</Alert>}

      {/* ── 追加フォーム ──────────────────────────────────── */}
      {showAdd && (
        <form
          onSubmit={addMember}
          className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="メールアドレス *"
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="taro@example.com"
              required
              autoFocus
            />
            <Input
              label="名前（任意）"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="田中太郎"
            />
          </div>
          <LangRadio label="通知言語" value={addLang} onChange={setAddLang} />
          {addError && <p className="text-xs text-red-600">{addError}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={adding}>追加</Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => { setShowAdd(false); setAddError('') }}
            >
              キャンセル
            </Button>
          </div>
        </form>
      )}

      {/* ── CSV フォーム ──────────────────────────────────── */}
      {showCsv && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
          <p className="text-xs text-gray-500">
            形式（1行1件）:{' '}
            <code className="bg-gray-200 px-1 rounded">
              email, 名前（省略可）, 言語（ja/en、省略時 ja）
            </code>
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            ref={fileRef}
            onChange={handleFileLoad}
            className="text-sm"
          />
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={5}
            placeholder={'taro@example.com, 田中太郎, ja\nhanako@example.com, , en'}
            className="text-xs font-mono border border-gray-300 rounded px-3 py-2 resize-y focus:outline-none focus:border-gray-500"
          />
          {csvResult && (
            <div className="text-xs flex flex-col gap-1">
              <p className="text-green-700">{csvResult.success} 件追加しました</p>
              {csvResult.errors.map((e, i) => (
                <p key={i} className="text-red-600">{e}</p>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={importCsv} loading={csvLoading}>
              インポート
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowCsv(false); setCsvResult(null); setCsvText('') }}
            >
              閉じる
            </Button>
          </div>
        </div>
      )}

      {/* ── 検索（5件超で表示） ───────────────────────────── */}
      {members.length > 5 && (
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="メール・名前で絞り込み"
          className="w-full max-w-xs text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-gray-500"
        />
      )}

      {/* ── テーブル ──────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                メール
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                名前
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide w-20">
                言語
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide w-24">
                状態
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide w-28">
                登録日
              </th>
              <th className="px-4 py-2.5 w-40" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-xs text-gray-400">
                  読み込み中…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-xs text-gray-400">
                  {search ? '一致する会員が見つかりません' : '会員がいません'}
                </td>
              </tr>
            )}
            {filtered.map((m) =>
              editingId === m.id ? (
                <EditRow
                  key={m.id}
                  member={m}
                  editName={editName}
                  editLang={editLang}
                  saving={saving}
                  error={editError}
                  onNameChange={setEditName}
                  onLangChange={setEditLang}
                  onSave={() => saveEdit(m.id)}
                  onCancel={cancelEdit}
                />
              ) : (
                <ViewRow
                  key={m.id}
                  member={m}
                  onEdit={() => startEdit(m)}
                  onToggle={() => toggleStatus(m)}
                  onDelete={() => deleteMember(m.id)}
                />
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── 表示行 ──────────────────────────────────────────────────
function ViewRow({
  member: m,
  onEdit,
  onToggle,
  onDelete,
}: {
  member: Member
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-gray-700">{m.email}</td>
      <td className="px-4 py-3 text-gray-700">
        {m.name ?? <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3">
        <Badge variant="muted">{m.preferred_language.toUpperCase()}</Badge>
      </td>
      <td className="px-4 py-3">
        <Badge variant={m.status === 'active' ? 'success' : 'muted'}>
          {m.status === 'active' ? 'アクティブ' : '無効'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">{formatDate(m.created_at)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onEdit}
            className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2"
          >
            編集
          </button>
          <button
            onClick={onToggle}
            className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2"
          >
            {m.status === 'active' ? '無効化' : '有効化'}
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-400 hover:text-red-600 underline underline-offset-2"
          >
            削除
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── 編集行 ──────────────────────────────────────────────────
function EditRow({
  member: m,
  editName,
  editLang,
  saving,
  error,
  onNameChange,
  onLangChange,
  onSave,
  onCancel,
}: {
  member: Member
  editName: string
  editLang: PreferredLanguage
  saving: boolean
  error: string
  onNameChange: (v: string) => void
  onLangChange: (v: PreferredLanguage) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <tr className="bg-blue-50">
      {/* email は変更不可 */}
      <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.email}</td>
      {/* name 編集 */}
      <td className="px-4 py-2">
        <input
          value={editName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="名前（任意）"
          className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
          autoFocus
        />
      </td>
      {/* lang 編集 */}
      <td className="px-4 py-2">
        <div className="flex gap-2">
          {(['ja', 'en'] as PreferredLanguage[]).map((l) => (
            <label key={l} className="flex items-center gap-1 cursor-pointer text-xs">
              <input
                type="radio"
                name={`lang-${m.id}`}
                value={l}
                checked={editLang === l}
                onChange={() => onLangChange(l)}
                className="accent-gray-900"
              />
              {l.toUpperCase()}
            </label>
          ))}
        </div>
      </td>
      {/* status は編集行では変更しない */}
      <td className="px-4 py-3">
        <Badge variant={m.status === 'active' ? 'success' : 'muted'}>
          {m.status === 'active' ? 'アクティブ' : '無効'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">{formatDate(m.created_at)}</td>
      <td className="px-4 py-2">
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave} loading={saving}>保存</Button>
            <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
              キャンセル
            </Button>
          </div>
          {error && <p className="text-xs text-red-600 text-right">{error}</p>}
        </div>
      </td>
    </tr>
  )
}

// ─── 言語ラジオ ──────────────────────────────────────────────
function LangRadio({
  label,
  value,
  onChange,
}: {
  label: string
  value: PreferredLanguage
  onChange: (v: PreferredLanguage) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex gap-4">
        {(['ja', 'en'] as PreferredLanguage[]).map((l) => (
          <label key={l} className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name={`lang-add-${l}`}
              value={l}
              checked={value === l}
              onChange={() => onChange(l)}
              className="accent-gray-900"
            />
            {l === 'ja' ? '日本語' : 'English'}
          </label>
        ))}
      </div>
    </div>
  )
}
