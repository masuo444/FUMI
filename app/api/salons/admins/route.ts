/**
 * GET  /api/salons/admins?salon_id=xxx — 管理者一覧 + 招待中
 * POST /api/salons/admins?salon_id=xxx — 管理者招待（email）
 * DELETE /api/salons/admins?salon_id=xxx&email=xxx — 管理者 or 招待削除
 *
 * 操作できるのはサロンの主オーナーのみ。上限は主オーナー含め3名。
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_ADMINS = 3

async function getOwner(supabase: Awaited<ReturnType<typeof createServiceClient>>, email: string) {
  const { data } = await supabase.from('owners').select('id').eq('email', email).single()
  return data
}

async function isPrimary(supabase: Awaited<ReturnType<typeof createServiceClient>>, ownerId: string, salonId: string) {
  const { data } = await supabase.from('salons').select('id').eq('id', salonId).eq('owner_id', ownerId).maybeSingle()
  return !!data
}

// GET — 現在の管理者リストと招待中メールを返す
export async function GET(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const salonId = request.nextUrl.searchParams.get('salon_id')
  if (!salonId) return NextResponse.json({ error: 'Missing salon_id' }, { status: 400 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const primary = await isPrimary(supabase, owner.id, salonId)
  if (!primary) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const [adminsResult, invitesResult, salonResult] = await Promise.all([
    supabase
      .from('salon_admins')
      .select('owner_id, owners(email, name)')
      .eq('salon_id', salonId),
    supabase
      .from('salon_admin_invites')
      .select('email, created_at')
      .eq('salon_id', salonId),
    supabase.from('salons').select('owner_id, owners(email, name)').eq('id', salonId).single(),
  ])

  const primaryOwnerEmail = (salonResult.data?.owners as any)?.email ?? ''
  const primaryOwnerName = (salonResult.data?.owners as any)?.name ?? ''

  const admins = [
    { email: primaryOwnerEmail, name: primaryOwnerName, role: 'primary' as const },
    ...(adminsResult.data ?? []).map((a: any) => ({
      email: a.owners?.email ?? '',
      name: a.owners?.name ?? '',
      role: 'co-admin' as const,
    })),
  ]
  const pendingInvites = (invitesResult.data ?? []).map((i: any) => i.email as string)

  return NextResponse.json({ admins, pendingInvites, max: MAX_ADMINS })
}

// POST — 管理者を招待
export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const salonId = request.nextUrl.searchParams.get('salon_id')
  if (!salonId) return NextResponse.json({ error: 'Missing salon_id' }, { status: 400 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const primary = await isPrimary(supabase, owner.id, salonId)
  if (!primary) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const { email } = await request.json()
  if (!email?.trim()) return NextResponse.json({ error: 'email is required' }, { status: 400 })
  const targetEmail = email.trim().toLowerCase()

  // 上限チェック（主オーナー + 共同管理者 + 招待中）
  const [adminsCount, invitesCount] = await Promise.all([
    supabase.from('salon_admins').select('*', { count: 'exact', head: true }).eq('salon_id', salonId),
    supabase.from('salon_admin_invites').select('*', { count: 'exact', head: true }).eq('salon_id', salonId),
  ])
  const total = 1 + (adminsCount.count ?? 0) + (invitesCount.count ?? 0) // 1 = 主オーナー
  if (total >= MAX_ADMINS) {
    return NextResponse.json({ error: `管理者は最大${MAX_ADMINS}名までです` }, { status: 400 })
  }

  // すでに owners テーブルにいるか確認
  const { data: existingOwner } = await supabase
    .from('owners')
    .select('id')
    .eq('email', targetEmail)
    .maybeSingle()

  if (existingOwner) {
    // すでに owner レコードあり → salon_admins に直接追加
    const { error } = await supabase.from('salon_admins').upsert(
      { salon_id: salonId, owner_id: existingOwner.id, invited_by: owner.id },
      { onConflict: 'salon_id,owner_id' },
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ status: 'added' })
  } else {
    // まだ未登録 → 招待テーブルに追加（ログイン時に自動承認）
    const { error } = await supabase.from('salon_admin_invites').upsert(
      { salon_id: salonId, email: targetEmail, invited_by: owner.id },
      { onConflict: 'salon_id,email' },
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ status: 'invited' })
  }
}

// DELETE — 管理者 or 招待を削除
export async function DELETE(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const salonId = request.nextUrl.searchParams.get('salon_id')
  const targetEmail = request.nextUrl.searchParams.get('email')
  if (!salonId || !targetEmail) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const primary = await isPrimary(supabase, owner.id, salonId)
  if (!primary) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  // salon_admins から削除
  const { data: targetOwner } = await supabase
    .from('owners')
    .select('id')
    .eq('email', targetEmail)
    .maybeSingle()

  if (targetOwner) {
    await supabase.from('salon_admins').delete().eq('salon_id', salonId).eq('owner_id', targetOwner.id)
  }
  // salon_admin_invites からも削除（念のため両方）
  await supabase.from('salon_admin_invites').delete().eq('salon_id', salonId).eq('email', targetEmail)

  return NextResponse.json({ success: true })
}
