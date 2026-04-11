import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Vercel Cron: runs every 5 minutes
// vercel.json: { "crons": [{ "path": "/api/cron/publish-scheduled", "schedule": "*/5 * * * *" }] }

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent public access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const now = new Date().toISOString()

  // Find scheduled posts whose time has passed
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, owner_id, salon_id, original_language, send_notification, cover_image_url')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)

  if (error) {
    console.error('[cron] fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({ published: 0 })
  }

  let published = 0
  for (const post of posts) {
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'published',
        published_at: now,
        scheduled_at: null,
      })
      .eq('id', post.id)

    if (!updateError) {
      published++
      console.log(`[cron] published post ${post.id}`)

      // Trigger notification if send_notification is enabled
      if (post.send_notification) {
        try {
          const { data: translations } = await supabase
            .from('post_translations')
            .select('*')
            .eq('post_id', post.id)

          const hasCompleted = (translations ?? []).some((t) => t.status === 'completed')
          if (hasCompleted) {
            // Re-use the notification logic via internal fetch (fire-and-forget)
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/posts`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-cron-internal': process.env.CRON_SECRET ?? '',
              },
              body: JSON.stringify({
                id: post.id,
                salon_id: post.salon_id,
                status: 'published',
                send_notification: true,
                newsletter_only: true,
                // Fields required by the API but not changed
                original_language: post.original_language,
                title: '',
                body: '',
                cover_image_url: post.cover_image_url,
              }),
            })
          }
        } catch (e) {
          console.error(`[cron] notification error for post ${post.id}:`, e)
        }
      }
    } else {
      console.error(`[cron] update error for post ${post.id}:`, updateError)
    }
  }

  return NextResponse.json({ published })
}
