'use client'
import { useState } from 'react'
import { SalonSettingsForm } from '@/components/owner/SalonSettingsForm'
import { SalonAdminsPanel } from '@/components/owner/SalonAdminsPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Salon } from '@/types'

interface AdminData {
  isPrimaryOwner: boolean
  admins: { email: string; name: string; role: 'primary' | 'co-admin' }[]
  pendingInvites: string[]
}

interface Props {
  initialSalons: Salon[]
  adminDataMap: Record<string, AdminData>
  currentUserEmail: string
}

export function SalonSettingsClient({ initialSalons, adminDataMap, currentUserEmail }: Props) {
  const [salons, setSalons] = useState<Salon[]>(initialSalons)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  function handleSaved(updated: Salon) {
    setSalons((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
  }

  async function createSalon() {
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    const res = await fetch('/api/salons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (res.ok) {
      const salon: Salon = await res.json()
      setSalons((prev) => [...prev, salon])
      setNewName('')
      setShowNew(false)
    } else {
      const { error } = await res.json()
      setError(error ?? '作成に失敗しました')
    }
    setCreating(false)
  }

  return (
    <div className="flex flex-col gap-8">
      {error && <Alert variant="danger">{error}</Alert>}

      {salons.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">
          サロンがありません。下のボタンから作成してください。
        </div>
      )}

      {salons.map((salon) => {
        const adminData = adminDataMap[salon.id]
        return (
          <div key={salon.id} className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{salon.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{salon.id}</p>
              </div>
              {adminData && !adminData.isPrimaryOwner && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                  共同管理者
                </span>
              )}
            </div>
            <div className="px-6 py-5">
              <SalonSettingsForm salon={salon} onSaved={handleSaved} />
            </div>
            {adminData && adminData.isPrimaryOwner && (
              <div className="px-6 py-5 border-t border-gray-100">
                <SalonAdminsPanel
                  salonId={salon.id}
                  initialAdmins={adminData.admins}
                  initialPendingInvites={adminData.pendingInvites}
                  currentUserEmail={currentUserEmail}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* 新規サロン追加（オーナーのみ） */}
      {salons.length === 0 && (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">新しいサロンを追加</h3>
          {showNew ? (
            <div className="flex flex-col gap-3">
              <Input
                label="サロン名"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createSalon()}
                placeholder="My New Salon"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={createSalon} loading={creating}>作成</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNew(false)}>キャンセル</Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setShowNew(true)}>
              + サロンを追加
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
