import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { canAccessSalon } from '@/lib/salon-access'

async function getOwner(supabase: Awaited<ReturnType<typeof createServiceClient>>, email: string) {
  const { data } = await supabase.from('owners').select('id').eq('email', email).single()
  return data
}

// GET /api/salons — オーナー（+ 共同管理者）のサロン一覧
export async function GET() {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  // 自分がオーナーのサロン + 共同管理者として招待されたサロン
  const [ownedResult, coAdminResult] = await Promise.all([
    supabase.from('salons').select('*').eq('owner_id', owner.id).order('created_at'),
    supabase.from('salon_admins').select('salon_id').eq('owner_id', owner.id),
  ])
  const owned = ownedResult.data ?? []
  const coAdminIds = (coAdminResult.data ?? []).map((r: any) => r.salon_id as string)

  let coAdminSalons: any[] = []
  if (coAdminIds.length > 0) {
    const { data } = await supabase.from('salons').select('*').in('id', coAdminIds).order('created_at')
    coAdminSalons = (data ?? []).filter((s: any) => !owned.find((o: any) => o.id === s.id))
  }

  return NextResponse.json([...owned, ...coAdminSalons])
}

// POST /api/salons — 新規サロン作成
export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const { name, description, payment_url } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('salons')
    .insert({ owner_id: owner.id, name: name.trim(), description: description ?? null, payment_url: payment_url ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/salons?id=xxx — サロン更新
export async function PATCH(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await request.json()
  const allowed = ['name', 'description', 'payment_url', 'invite_code', 'notification_language', 'hero_image_url'] as const
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key] ?? null
  }
  if (updates.name !== undefined && !String(updates.name).trim()) {
    return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
  }

  // アクセス権チェック（オーナー OR 共同管理者）
  const hasAccess = await canAccessSalon(supabase, owner.id, id)
  if (!hasAccess) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const { data, error } = await supabase
    .from('salons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
