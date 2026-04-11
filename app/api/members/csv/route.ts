import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/members/csv — bulk import from CSV text
export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: owner } = await supabase
    .from('owners').select('id').eq('email', user.email!).single()
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const { salon_id, csv } = await request.json()
  if (!salon_id || !csv) return NextResponse.json({ error: 'salon_id and csv required' }, { status: 400 })

  // Verify salon
  const { data: salon } = await supabase
    .from('salons').select('id').eq('id', salon_id).eq('owner_id', owner.id).single()
  if (!salon) return NextResponse.json({ error: 'Salon not found' }, { status: 404 })

  const lines = (csv as string).trim().split('\n').filter(Boolean)
  const rows: Array<{ salon_id: string; email: string; name: string | null; preferred_language: string }> = []
  const errors: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c: string) => c.trim().replace(/^"|"$/g, ''))
    const email = cols[0]
    const name = cols[1] || null
    const lang = cols[2] || 'ja'

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Row ${i + 1}: invalid email "${email}"`)
      continue
    }
    if (!['ja', 'en'].includes(lang)) {
      errors.push(`Row ${i + 1}: invalid language "${lang}"`)
      continue
    }
    rows.push({ salon_id, email, name, preferred_language: lang })
  }

  if (rows.length === 0) {
    return NextResponse.json({ success: 0, errors })
  }

  const { data, error } = await supabase
    .from('members')
    .upsert(rows, { onConflict: 'salon_id,email', ignoreDuplicates: true })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: data?.length ?? 0, errors })
}
