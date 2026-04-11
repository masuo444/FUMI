import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { UpdateSenderAddressRequest } from '@/types'

async function getOwner(supabase: Awaited<ReturnType<typeof createServiceClient>>, email: string) {
  const { data } = await supabase.from('owners').select('id').eq('email', email).single()
  return data
}

// POST /api/domains/address — create sender address
export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const body: UpdateSenderAddressRequest & { sender_domain_id?: string } = await request.json()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.from_email)) {
    return NextResponse.json({ error: 'Invalid from_email' }, { status: 400 })
  }

  if (body.is_default) {
    await supabase.from('owner_sender_addresses')
      .update({ is_default: false }).eq('owner_id', owner.id)
  }

  const { data, error } = await supabase.from('owner_sender_addresses').insert({
    owner_id: owner.id,
    sender_domain_id: body.sender_domain_id ?? null,
    from_name: body.from_name,
    from_email: body.from_email,
    reply_to_email: body.reply_to_email ?? null,
    is_default: body.is_default ?? false,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/domains/address?id=xxx
export async function PATCH(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body: Partial<UpdateSenderAddressRequest> = await request.json()

  if (body.is_default) {
    await supabase.from('owner_sender_addresses')
      .update({ is_default: false }).eq('owner_id', owner.id)
  }

  const { data, error } = await supabase.from('owner_sender_addresses')
    .update(body).eq('id', id).eq('owner_id', owner.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/domains/address?id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await supabase.from('owner_sender_addresses').delete().eq('id', id).eq('owner_id', owner.id)
  return NextResponse.json({ success: true })
}
