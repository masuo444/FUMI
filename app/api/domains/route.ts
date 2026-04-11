import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

async function getOwner(supabase: Awaited<ReturnType<typeof createServiceClient>>, email: string) {
  const { data } = await supabase.from('owners').select('id').eq('email', email).single()
  return data
}

// GET /api/domains
export async function GET(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const { data } = await supabase
    .from('owner_sender_domains')
    .select('*, owner_sender_addresses(*)')
    .eq('owner_id', owner.id)
    .order('created_at', { ascending: true })

  return NextResponse.json(data ?? [])
}

// POST /api/domains — add domain
export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const { domain } = await request.json()
  if (!domain) return NextResponse.json({ error: 'domain required' }, { status: 400 })

  // Register domain with Resend
  let resendDomainId: string | null = null
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const res = await resend.domains.create({ name: domain })
    resendDomainId = (res.data as any)?.id ?? null
  } catch (_) {
    // If Resend call fails, continue without ID
  }

  const { data, error } = await supabase.from('owner_sender_domains').insert({
    owner_id: owner.id,
    domain,
    resend_domain_id: resendDomainId,
    verification_status: 'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// POST /api/domains/verify?id=xxx
export async function PATCH(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data: domainRow } = await supabase
    .from('owner_sender_domains')
    .select('*')
    .eq('id', id)
    .eq('owner_id', owner.id)
    .single()

  if (!domainRow) return NextResponse.json({ error: 'Domain not found' }, { status: 404 })

  // Check verification status with Resend
  if (domainRow.resend_domain_id) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const res = await resend.domains.get(domainRow.resend_domain_id)
      const d = res.data as any
      const status = d?.status === 'verified' ? 'verified' : 'pending'
      await supabase.from('owner_sender_domains').update({
        verification_status: status,
        dkim_status: d?.dkim_status === 'verified',
        spf_status: d?.spf_status === 'verified',
        dmarc_status: d?.dmarc_status === 'verified',
        verified_at: status === 'verified' ? new Date().toISOString() : null,
      }).eq('id', id)
    } catch (_) {}
  }

  const { data } = await supabase
    .from('owner_sender_domains')
    .select('*')
    .eq('id', id)
    .single()

  return NextResponse.json(data)
}

// DELETE /api/domains?id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await supabase.from('owner_sender_domains').delete().eq('id', id).eq('owner_id', owner.id)
  return NextResponse.json({ success: true })
}
