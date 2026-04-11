'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Owner = {
  id: string
  plan: string
  created_at: string
  stripe_subscription_id: string | null
  pro_expires_at: string | null
}

type Salon = {
  id: string
  name: string
}

type WebhookConfig = {
  id: string
  webhook_token: string
  salon_id: string
} | null

const TRIAL_DAYS = 5

function getTrialInfo(createdAt: string) {
  const created = new Date(createdAt)
  const trialEnd = new Date(created.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
  const now = new Date()
  const msLeft = trialEnd.getTime() - now.getTime()
  const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)))
  const inTrial = msLeft > 0
  return { inTrial, daysLeft, trialEnd }
}

export function BillingClient() {
  const searchParams = useSearchParams()
  const upgraded = searchParams.get('upgraded') === '1'

  const [owner, setOwner] = useState<Owner | null>(null)
  const [salons, setSalons] = useState<Salon[]>([])
  const [webhookConfigs, setWebhookConfigs] = useState<Record<string, WebhookConfig>>({})
  const [secretInputs, setSecretInputs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  useEffect(() => {
    async function load() {
      const [ownerRes, salonsRes] = await Promise.all([
        fetch('/api/owner/me'),
        fetch('/api/salons'),
      ])
      const ownerData = await ownerRes.json()
      const salonsData = await salonsRes.json()
      setOwner(ownerData)
      const salonList: Salon[] = salonsData ?? []
      setSalons(salonList)

      const configs: Record<string, WebhookConfig> = {}
      await Promise.all(
        salonList.map(async (s) => {
          const res = await fetch(`/api/billing/stripe-connect?salon_id=${s.id}`)
          configs[s.id] = res.ok ? await res.json() : null
        })
      )
      setWebhookConfigs(configs)
      setLoading(false)
    }
    load()
  }, [])

  async function handleUpgrade() {
    setUpgrading(true)
    try {
      const res = await fetch('/api/billing/subscribe', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setUpgrading(false)
        alert(data.error ?? 'Stripeへの接続に失敗しました')
      }
    } catch (e: any) {
      setUpgrading(false)
      alert('通信エラーが発生しました。再試行してください。')
    }
  }

  async function handlePortal() {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  async function handleSaveWebhook(salonId: string) {
    const secret = secretInputs[salonId]?.trim()
    if (!secret) return
    setSaving(prev => ({ ...prev, [salonId]: true }))
    const res = await fetch('/api/billing/stripe-connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salon_id: salonId, stripe_webhook_secret: secret }),
    })
    const data = await res.json()
    if (res.ok) {
      setWebhookConfigs(prev => ({ ...prev, [salonId]: data }))
      setSecretInputs(prev => ({ ...prev, [salonId]: '' }))
    }
    setSaving(prev => ({ ...prev, [salonId]: false }))
  }

  async function handleDeleteWebhook(salonId: string) {
    setDeleting(prev => ({ ...prev, [salonId]: true }))
    await fetch(`/api/billing/stripe-connect?salon_id=${salonId}`, { method: 'DELETE' })
    setWebhookConfigs(prev => ({ ...prev, [salonId]: null }))
    setDeleting(prev => ({ ...prev, [salonId]: false }))
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  const isPro = owner?.plan === 'pro'
  const trial = owner ? getTrialInfo(owner.created_at) : null

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Plan & billing</h1>

      {upgraded && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded">
          You're now on the Pro plan. All features are unlocked.
        </div>
      )}

      {/* Trial banner */}
      {!isPro && trial?.inTrial && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded flex items-center justify-between gap-4">
          <span>
            <strong>{trial.daysLeft} day{trial.daysLeft !== 1 ? 's' : ''} left</strong> in your free trial.
            Subscribe before {trial.trialEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to keep access.
          </span>
          <Link href="/dashboard" className="text-blue-700 underline whitespace-nowrap text-xs">
            Back to dashboard
          </Link>
        </div>
      )}

      {/* Expired banner */}
      {!isPro && !trial?.inTrial && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded">
          Your free trial has ended. Subscribe to continue using Fumi.
        </div>
      )}

      {/* Plan card */}
      <section className="mb-8 p-6 border border-gray-200 rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Current plan</div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">
                {isPro ? 'Pro' : trial?.inTrial ? 'Free trial' : 'Expired'}
              </span>
              {isPro && (
                <span className="px-2 py-0.5 text-xs bg-black text-white rounded font-medium">PRO</span>
              )}
            </div>
          </div>
          {isPro && owner?.pro_expires_at && (
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-0.5">Next renewal</div>
              <div className="text-sm font-medium">
                {new Date(owner.pro_expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
          )}
        </div>

        {isPro ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              All features active — unlimited members, auto-translation, Stripe integration.
            </p>
            <button
              onClick={handlePortal}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Manage subscription (Stripe portal)
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <ul className="text-sm text-gray-600 space-y-1.5">
              {[
                'Unlimited members',
                'Auto-translation (any language)',
                'Stripe auto-member-add via webhook',
                'Multi-language email delivery',
              ].map(f => (
                <li key={f} className="flex gap-2"><span className="text-[#4F6AF5]">›</span>{f}</li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="px-5 py-2.5 text-sm bg-black text-white rounded hover:bg-gray-800 transition-colors font-medium disabled:opacity-40"
            >
              {upgrading ? 'Redirecting…' : 'Subscribe — $10 / month'}
            </button>
            <p className="text-xs text-gray-400">Cancel anytime. No setup fee.</p>
          </div>
        )}
      </section>

      {/* Stripe webhook (Pro only) */}
      {isPro && (
        <section>
          <h2 className="text-lg font-bold mb-1">Stripe auto-member-add</h2>
          <p className="text-sm text-gray-500 mb-5">
            Connect your Stripe account to automatically add members when a checkout completes.
          </p>

          <div className="space-y-6">
            {salons.map(salon => {
              const config = webhookConfigs[salon.id]
              const webhookUrl = config?.webhook_token
                ? `${appUrl}/api/owner-webhook/${config.webhook_token}`
                : null

              return (
                <div key={salon.id} className="p-5 border border-gray-200 rounded-lg">
                  <div className="font-medium mb-3">{salon.name}</div>

                  {config ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Webhook URL — paste into your Stripe Dashboard
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-3 py-2 break-all">
                            {webhookUrl}
                          </code>
                          <button
                            onClick={() => copyToClipboard(webhookUrl!, salon.id)}
                            className="px-3 py-2 text-xs border border-gray-200 rounded hover:bg-gray-50 whitespace-nowrap transition-colors"
                          >
                            {copied === salon.id ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        Listen for: <code>checkout.session.completed</code>
                      </div>
                      <button
                        onClick={() => handleDeleteWebhook(salon.id)}
                        disabled={deleting[salon.id]}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        {deleting[salon.id] ? 'Removing…' : 'Remove integration'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500">
                        Enter your Stripe Webhook Signing Secret (<code>whsec_...</code>)
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="whsec_xxxxxxxxxxxxxxxxxx"
                          value={secretInputs[salon.id] ?? ''}
                          onChange={e =>
                            setSecretInputs(prev => ({ ...prev, [salon.id]: e.target.value }))
                          }
                          className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black"
                        />
                        <button
                          onClick={() => handleSaveWebhook(salon.id)}
                          disabled={saving[salon.id] || !secretInputs[salon.id]?.trim()}
                          className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-40 transition-colors"
                        >
                          {saving[salon.id] ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
