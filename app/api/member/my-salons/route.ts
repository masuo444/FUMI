import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET — ログイン中メンバーが参加しているサロン一覧
export async function GET() {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 参加中サロンのIDを取得
  const { data: memberships } = await supabase
    .from('members')
    .select('salon_id, status')
    .eq('email', user.email!)
    .eq('status', 'active')

  if (!memberships || memberships.length === 0) {
    return NextResponse.json([])
  }

  const salonIds = memberships.map((m: { salon_id: string }) => m.salon_id)

  const { data: salons } = await supabase
    .from('salons')
    .select('id, name, description, hero_image_url')
    .in('id', salonIds)
    .order('name')

  return NextResponse.json(salons ?? [])
}
