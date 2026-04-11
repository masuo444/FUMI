'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

interface Admin {
  email: string
  name: string
  role: 'primary' | 'co-admin'
}

interface Props {
  salonId: string
  initialAdmins: Admin[]
  initialPendingInvites: string[]
  currentUserEmail: string
}

const MAX_ADMINS = 3

export function SalonAdminsPanel({
  salonId,
  initialAdmins,
  initialPendingInvites,
  currentUserEmail,
}: Props) {
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins)
  const [pendingInvites, setPendingInvites] = useState<string[]>(initialPendingInvites)
  const [showAdd, setShowAdd] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const totalCount = admins.length + pendingInvites.length
  const canAdd = totalCount < MAX_ADMINS

  async function addAdmin() {
    if (!newEmail.trim()) return
    setAdding(true)
    setError('')
    setSuccess('')
    const res = await fetch(`/api/salons/admins?salon_id=${salonId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail.trim().toLowerCase() }),
    })
    if (res.ok) {
      const result = await res.json()
      if (result.status === 'added') {
        setAdmins((prev) => [
          ...prev,
          { email: newEmail.trim().toLowerCase(), name: newEmail.split('@')[0], role: 'co-admin' },
        ])
        setSuccess(`${newEmail} を管理者として追加しました`)
      } else {
        setPendingInvites((prev) => [...prev, newEmail.trim().toLowerCase()])
        setSuccess(`${newEmail} に招待を送りました（ログイン後に有効化されます）`)
      }
      setNewEmail('')
      setShowAdd(false)
      setTimeout(() => setSuccess(''), 4000)
    } else {
      const { error } = await res.json()
      setError(error ?? '追加に失敗しました')
    }
    setAdding(false)
  }

  async function removeAdmin(email: string) {
    setRemoving(email)
    setError('')
    const res = await fetch(
      `/api/salons/admins?salon_id=${salonId}&email=${encodeURIComponent(email)}`,
      { method: 'DELETE' },
    )
    if (res.ok) {
      setAdmins((prev) => prev.filter((a) => a.email !== email))
      setPendingInvites((prev) => prev.filter((e) => e !== email))
    } else {
      const { error } = await res.json()
      setError(error ?? '削除に失敗しました')
    }
    setRemoving(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          管理者 ({totalCount}/{MAX_ADMINS}名)
        </h3>
        {canAdd && !showAdd && (
          <Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}>
            + 管理者を追加
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      {success && <Alert variant="success" className="mb-3">{success}</Alert>}

      {/* 追加フォーム */}
      {showAdd && (
        <div className="mb-4 p-4 rounded-lg bg-gray-50 border border-gray-200 flex flex-col gap-3">
          <Input
            label="メールアドレス"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAdmin()}
            placeholder="example@gmail.com"
            autoFocus
          />
          <p className="text-xs text-gray-400">
            まだ登録していないメールでも招待できます。ログイン後に自動で管理者になります。
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={addAdmin} loading={adding}>招待する</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setNewEmail('') }}>
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {/* 管理者リスト */}
      <div className="flex flex-col gap-1.5">
        {admins.map((admin) => (
          <div key={admin.email} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
            <div>
              <span className="text-sm text-gray-800">{admin.email}</span>
              {admin.email === currentUserEmail && (
                <span className="ml-2 text-xs text-gray-400">（あなた）</span>
              )}
              {admin.role === 'primary' && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                  主オーナー
                </span>
              )}
            </div>
            {admin.role === 'co-admin' && admin.email !== currentUserEmail && (
              <button
                onClick={() => removeAdmin(admin.email)}
                disabled={removing === admin.email}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                {removing === admin.email ? '削除中…' : '削除'}
              </button>
            )}
          </div>
        ))}

        {/* 招待中 */}
        {pendingInvites.map((email) => (
          <div key={email} className="flex items-center justify-between py-2 px-3 rounded-lg bg-amber-50 border border-amber-100">
            <div>
              <span className="text-sm text-gray-700">{email}</span>
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                招待中
              </span>
            </div>
            <button
              onClick={() => removeAdmin(email)}
              disabled={removing === email}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              {removing === email ? '削除中…' : 'キャンセル'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
