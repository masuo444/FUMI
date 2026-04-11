'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { OwnerSenderDomain, OwnerSenderAddress } from '@/types'

type DomainWithAddresses = OwnerSenderDomain & { owner_sender_addresses: OwnerSenderAddress[] }

export function DomainsClient({ initialDomains }: { initialDomains: DomainWithAddresses[] }) {
  const [domains, setDomains] = useState(initialDomains)
  const [newDomain, setNewDomain] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Address form
  const [showAddrForm, setShowAddrForm] = useState<string | null>(null)
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [savingAddr, setSavingAddr] = useState(false)

  async function addDomain() {
    if (!newDomain.trim()) return
    setAdding(true)
    setError('')
    const res = await fetch('/api/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: newDomain.trim() }),
    })
    if (res.ok) {
      const d = await res.json()
      setDomains((prev) => [...prev, { ...d, owner_sender_addresses: [] }])
      setNewDomain('')
      setSuccess('ドメインを追加しました。以下のDNSレコードを設定してください。')
    } else {
      const { error } = await res.json()
      setError(error)
    }
    setAdding(false)
  }

  async function verify(id: string) {
    const res = await fetch(`/api/domains?id=${id}`, { method: 'PATCH' })
    if (res.ok) {
      const d = await res.json()
      setDomains((prev) => prev.map((dom) => dom.id === id ? { ...dom, ...d } : dom))
    }
  }

  async function deleteDomain(id: string) {
    if (!confirm('このドメインを削除しますか？')) return
    await fetch(`/api/domains?id=${id}`, { method: 'DELETE' })
    setDomains((prev) => prev.filter((d) => d.id !== id))
  }

  async function saveAddress(domainId: string) {
    setSavingAddr(true)
    setError('')
    const res = await fetch('/api/domains/address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_domain_id: domainId,
        from_name: fromName,
        from_email: fromEmail,
        reply_to_email: replyTo || undefined,
        is_default: true,
      }),
    })
    if (res.ok) {
      const addr = await res.json()
      setDomains((prev) => prev.map((d) =>
        d.id === domainId
          ? { ...d, owner_sender_addresses: [...d.owner_sender_addresses, addr] }
          : d
      ))
      setShowAddrForm(null)
      setFromName(''); setFromEmail(''); setReplyTo('')
      setSuccess('送信元アドレスを保存しました')
    } else {
      const { error } = await res.json()
      setError(error)
    }
    setSavingAddr(false)
  }

  async function deleteAddress(domainId: string, addrId: string) {
    await fetch(`/api/domains/address?id=${addrId}`, { method: 'DELETE' })
    setDomains((prev) => prev.map((d) =>
      d.id === domainId
        ? { ...d, owner_sender_addresses: d.owner_sender_addresses.filter((a) => a.id !== addrId) }
        : d
    ))
  }

  return (
    <div className="flex flex-col gap-6">
      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Add domain */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold mb-4">ドメインを追加</h2>
        <div className="flex gap-3">
          <Input
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="mail.yourdomain.com"
            className="flex-1"
          />
          <Button onClick={addDomain} loading={adding}>追加</Button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Resendでドメイン認証後、メール送信に使用できます。
        </p>
      </div>

      {/* Domains list */}
      {domains.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">
          ドメインが登録されていません。<br />
          未設定の場合は共通ドメイン（{process.env.NEXT_PUBLIC_APP_URL ?? 'サービスのデフォルト'}）から送信されます。
        </div>
      )}

      {domains.map((domain) => (
        <div key={domain.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-medium">{domain.domain}</span>
              <VerificationBadge status={domain.verification_status} />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => verify(domain.id)}>
                検証を確認
              </Button>
              <Button size="sm" variant="danger" onClick={() => deleteDomain(domain.id)}>
                削除
              </Button>
            </div>
          </div>

          {/* DNS records info */}
          {domain.verification_status !== 'verified' && (
            <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100">
              <p className="text-sm font-medium text-yellow-800 mb-2">以下のDNSレコードを設定してください</p>
              <div className="text-xs font-mono text-yellow-700 space-y-1">
                <div className="flex gap-2">
                  <StatusDot ok={domain.dkim_status} /> DKIM: Resend管理画面でDKIMレコードを確認
                </div>
                <div className="flex gap-2">
                  <StatusDot ok={domain.spf_status} /> SPF: v=spf1 include:amazonses.com ~all
                </div>
                <div className="flex gap-2">
                  <StatusDot ok={domain.dmarc_status} /> DMARC: v=DMARC1; p=none; rua=mailto:dmarc@{domain.domain}
                </div>
              </div>
            </div>
          )}

          {/* Sender addresses */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">送信元アドレス</h3>
              {domain.verification_status === 'verified' && (
                <Button size="sm" variant="ghost" onClick={() => setShowAddrForm(domain.id)}>
                  + アドレスを追加
                </Button>
              )}
            </div>

            {domain.owner_sender_addresses.length === 0 && (
              <p className="text-xs text-gray-400">
                {domain.verification_status === 'verified'
                  ? 'アドレスが設定されていません'
                  : 'ドメイン認証後に設定できます'}
              </p>
            )}

            {domain.owner_sender_addresses.map((addr) => (
              <div key={addr.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="text-sm">
                  <span className="font-medium">{addr.from_name}</span>
                  <span className="text-gray-400 ml-2">&lt;{addr.from_email}&gt;</span>
                  {addr.reply_to_email && (
                    <span className="text-gray-400 ml-2 text-xs">Reply-To: {addr.reply_to_email}</span>
                  )}
                  {addr.is_default && <Badge variant="success" className="ml-2">デフォルト</Badge>}
                </div>
                <button
                  onClick={() => deleteAddress(domain.id, addr.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  削除
                </button>
              </div>
            ))}

            {showAddrForm === domain.id && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="From名" value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="My Salon" />
                  <Input label="Fromメール" type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder={`hello@${domain.domain}`} />
                </div>
                <Input label="Reply-To（任意）" type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="reply@yourdomain.com" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveAddress(domain.id)} loading={savingAddr}>保存</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddrForm(null)}>キャンセル</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function VerificationBadge({ status }: { status: string }) {
  if (status === 'verified') return <Badge variant="success">認証済み</Badge>
  if (status === 'failed') return <Badge variant="danger">認証失敗</Badge>
  return <Badge variant="warning">認証待ち</Badge>
}

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={ok ? 'text-green-500' : 'text-yellow-500'}>{ok ? '✓' : '○'}</span>
}
