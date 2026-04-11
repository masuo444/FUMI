import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/member/join
// 招待コードを検証 → members に追加 → OTP 送信
export async function POST(request: NextRequest) {
  const { email, invite_code, salon_id } = await request.json()

  if (!email || !invite_code || !salon_id) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }

  const service = await createServiceClient()

  // サロンの招待コードを確認
  const { data: salon } = await service
    .from('salons')
    .select('id, name, invite_code')
    .eq('id', salon_id)
    .single()

  if (!salon) {
    return NextResponse.json({ error: 'サロンが見つかりません' }, { status: 404 })
  }

  if (!salon.invite_code || salon.invite_code.trim() !== invite_code.trim()) {
    return NextResponse.json({ error: '招待コードが正しくありません' }, { status: 403 })
  }

  // すでに会員かチェック
  const { data: existing } = await service
    .from('members')
    .select('id, status')
    .eq('salon_id', salon_id)
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (existing) {
    if (existing.status === 'active') {
      // すでに会員 → そのままログインリンクを送る
    } else {
      // 無効化されていた → 有効化
      await service
        .from('members')
        .update({ status: 'active' })
        .eq('id', existing.id)
    }
  } else {
    // 新規会員として追加
    await service.from('members').insert({
      salon_id,
      email: email.toLowerCase().trim(),
      name: null,
      preferred_language: 'ja',
      status: 'active',
    })
  }

  // OTP（マジックリンク）送信は client 側で行う
  return NextResponse.json({ ok: true })
}
