'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { WalletTransaction } from '@/types'
import { formatDate } from '@/lib/utils'
import { MIN_CHARGE_AMOUNT_USD } from '@/types'

const CHARGE_PRESETS_USD = [5, 10, 20, 50]

function formatCredits(credits: number): string {
  return credits.toLocaleString()
}

export function WalletClient({
  balance,
  transactions,
}: {
  balance: number
  transactions: WalletTransaction[]
}) {
  const [amount, setAmount] = useState(10) // USD
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function charge() {
    if (amount < MIN_CHARGE_AMOUNT_USD) {
      setError(`Minimum top-up is $${MIN_CHARGE_AMOUNT_USD}`)
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    } else {
      const { error } = await res.json()
      setError(error)
      setLoading(false)
    }
  }

  const lowBalance = balance < 100

  return (
    <div className="flex flex-col gap-6">
      {/* Balance card */}
      <div className={`rounded-lg border p-6 ${lowBalance ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
        <p className="text-sm text-gray-500 mb-1">翻訳クレジット残高</p>
        <p className={`text-4xl font-bold mb-1 ${lowBalance ? 'text-yellow-700' : 'text-gray-900'}`}>
          {formatCredits(balance)} <span className="text-lg font-normal text-gray-400">credits</span>
        </p>
        {lowBalance && (
          <p className="text-sm text-yellow-700 mt-2">
            残高が少なくなっています。チャージすると翻訳機能が使えます。
          </p>
        )}
      </div>

      {/* Charge */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold mb-4">クレジットをチャージ</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {CHARGE_PRESETS_USD.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={`px-3 py-1.5 rounded border text-sm transition-colors ${
                amount === p
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-gray-400'
              }`}
            >
              ${p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-500">金額:</span>
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <span className="px-3 py-2 bg-gray-50 text-sm text-gray-500">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={MIN_CHARGE_AMOUNT_USD}
              step={1}
              className="w-24 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        <Button onClick={charge} loading={loading}>
          Stripeでチャージ → ${amount}
        </Button>
        <p className="text-xs text-gray-400 mt-2">
          Stripe決済画面に遷移します。
        </p>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold">利用履歴</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {transactions.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-400">履歴がありません</p>
          )}
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-4 px-6 py-3">
              <div className="flex-1">
                <p className="text-sm">{tx.note ?? tx.reference_type}</p>
                <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
              </div>
              <div className="text-right">
                <span className={`font-medium text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-gray-700'}`}>
                  {tx.amount > 0 ? '+' : ''}{Math.abs(tx.amount).toLocaleString()} cr
                </span>
              </div>
              <Badge variant={tx.type === 'charge' ? 'success' : tx.type === 'consume' ? 'muted' : 'warning'}>
                {tx.type === 'charge' ? 'チャージ' : tx.type === 'consume' ? '消費' : '返金'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
