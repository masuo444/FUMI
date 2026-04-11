import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/member/login
// Verifies the email belongs to an active member of the salon.
// The client then calls supabase.auth.signInWithOtp() to send the magic link.
export async function POST(request: NextRequest) {
  const { email, salon_id } = await request.json()

  if (!email || !salon_id) {
    return NextResponse.json({ error: 'email と salon_id は必須です' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { data: member } = await supabase
    .from('members')
    .select('id, name')
    .eq('email', email.toLowerCase().trim())
    .eq('salon_id', salon_id)
    .eq('status', 'active')
    .maybeSingle()

  if (!member) {
    return NextResponse.json(
      { error: 'このサロンの会員として登録されていません' },
      { status: 403 }
    )
  }

  return NextResponse.json({ ok: true })
}
