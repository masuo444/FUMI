import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { CreateMemberRequest } from '@/types'

async function getOwner(supabase: Awaited<ReturnType<typeof createServiceClient>>, email: string) {
  const { data } = await supabase.from('owners').select('id').eq('email', email).single()
  return data
}

// GET /api/members?salon_id=xxx
export async function GET(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const salonId = request.nextUrl.searchParams.get('salon_id')
  if (!salonId) return NextResponse.json({ error: 'salon_id required' }, { status: 400 })

  // Verify salon belongs to owner
  const { data: salon } = await supabase
    .from('salons').select('id').eq('id', salonId).eq('owner_id', owner.id).single()
  if (!salon) return NextResponse.json({ error: 'Salon not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('salon_id', salonId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/members — create
export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const body: CreateMemberRequest = await request.json()
  const { salon_id, email, name, preferred_language } = body

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  if (!['ja', 'en'].includes(preferred_language)) {
    return NextResponse.json({ error: 'Invalid preferred_language' }, { status: 400 })
  }

  // Verify salon belongs to owner
  const { data: salon } = await supabase
    .from('salons').select('id').eq('id', salon_id).eq('owner_id', owner.id).single()
  if (!salon) return NextResponse.json({ error: 'Salon not found' }, { status: 404 })

  const { data, error } = await supabase.from('members').insert({
    salon_id,
    email,
    name: name ?? null,
    preferred_language,
    status: 'active',
  }).select().single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/members?id=xxx — update
export async function PATCH(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await request.json()
  const allowed = ['name', 'preferred_language', 'status']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (updates.preferred_language && !['ja', 'en'].includes(updates.preferred_language as string)) {
    return NextResponse.json({ error: 'Invalid preferred_language' }, { status: 400 })
  }

  // Verify the member belongs to this owner's salons
  const { data: member } = await supabase
    .from('members')
    .select('salon_id')
    .eq('id', id)
    .single()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { data: salonCheck } = await supabase
    .from('salons')
    .select('id')
    .eq('id', member.salon_id)
    .eq('owner_id', owner.id)
    .single()
  if (!salonCheck) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/members?id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Verify the member belongs to a salon owned by this owner
  const { data: member } = await supabase
    .from('members')
    .select('salon_id')
    .eq('id', id)
    .single()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { data: salonCheck } = await supabase
    .from('salons')
    .select('id')
    .eq('id', member.salon_id)
    .eq('owner_id', owner.id)
    .single()
  if (!salonCheck) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('members').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
