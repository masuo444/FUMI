import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { translatePost, estimateTranslationCost } from '@/lib/claude'
import { deductWalletBalance, addWalletBalance } from '@/lib/wallet'
import { sendArticleNotification } from '@/lib/resend'
import { isAdminEmail } from '@/lib/auth'
import { getAccessibleSalonIds, canAccessSalon } from '@/lib/salon-access'
import { CreatePostRequest, LanguageCode } from '@/types'

async function getOwner(supabase: Awaited<ReturnType<typeof createServiceClient>>, email: string) {
  const { data } = await supabase
    .from('owners')
    .select('*')
    .eq('email', email)
    .single()
  return data
}

// GET /api/posts?salon_id=xxx
export async function GET(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const salonId = request.nextUrl.searchParams.get('salon_id')

  // アクセス可能なサロン全件（自分がオーナー + 共同管理者）
  const accessibleIds = await getAccessibleSalonIds(supabase, owner.id)
  const filterIds = salonId ? [salonId] : accessibleIds

  if (filterIds.length === 0) return NextResponse.json([])

  // salon_id でフィルター（owner_id ではなく）
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      post_translations(id, language_code, title, status),
      post_images(id, image_url, sort_order)
    `)
    .in('salon_id', filterIds)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/posts  — create or update + publish
export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = isAdminEmail(user.email!)

  const owner = await getOwner(supabase, user.email!)
  // Admin doesn't need to be an owner themselves for editing other salons,
  // but we still need an owner record for wallet/translation operations.
  // For admin editing another owner's post, the post's actual owner handles the wallet.
  if (!owner && !isAdmin) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const body: CreatePostRequest & { id?: string; manual_translation?: { title: string; body: string }; newsletter_only?: boolean } = await request.json()
  const { title, body: postBody, original_language, salon_id, cover_image_url, status, send_notification, id, manual_translation, newsletter_only } = body

  if (!['ja', 'en'].includes(original_language)) {
    return NextResponse.json({ error: 'Invalid original_language' }, { status: 400 })
  }

  // For admin editing an existing post: fetch the actual owner from the post
  let effectiveOwner = owner
  if (isAdmin && id && !owner) {
    const { data: postRow } = await supabase.from('posts').select('owner_id').eq('id', id).single()
    if (postRow) {
      const { data: actualOwner } = await supabase.from('owners').select('*').eq('id', postRow.owner_id).single()
      effectiveOwner = actualOwner
    }
  }

  // Upsert post
  let postId = id
  if (postId) {
    // Admin can edit any post (no owner_id filter); regular owner is filtered
    const updateQuery = supabase.from('posts').update({
      original_language,
      cover_image_url: cover_image_url ?? null,
      status,
      send_notification,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }).eq('id', postId)
    if (!isAdmin) updateQuery.eq('owner_id', effectiveOwner!.id)
    const { error } = await updateQuery
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    // 新規投稿: サロンへのアクセス権確認（オーナー or 共同管理者）
    if (!isAdmin && salon_id) {
      const ok = await canAccessSalon(supabase, owner!.id, salon_id)
      if (!ok) return NextResponse.json({ error: 'Not authorized for this salon' }, { status: 403 })
    }
    const { data: newPost, error } = await supabase.from('posts').insert({
      salon_id,
      owner_id: owner!.id,
      original_language,
      cover_image_url: cover_image_url ?? null,
      status,
      send_notification,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    postId = newPost.id
  }

  // Upsert original-language translation (always completed)
  await supabase.from('post_translations').upsert({
    post_id: postId,
    language_code: original_language,
    title,
    body: postBody,
    status: 'completed',
    generated_at: new Date().toISOString(),
  }, { onConflict: 'post_id,language_code' })

  // Translation + notification: on publish OR newsletter_only mode
  if (status === 'published' || newsletter_only) {
    const targetLang: LanguageCode = original_language === 'ja' ? 'en' : 'ja'

    // ── Check if target translation is already completed ──────────────
    // "Translate only once": if the target-language record already has
    // status=completed we skip translation entirely (no cost, no re-write).
    // This means editing + re-publishing a post does not re-charge the owner.
    const { data: existingTarget } = await supabase
      .from('post_translations')
      .select('status')
      .eq('post_id', postId!)
      .eq('language_code', targetLang)
      .maybeSingle()

    if (manual_translation?.title && manual_translation?.body) {
      // Manual bilingual input — save directly as completed, no token cost
      await supabase.from('post_translations').upsert({
        post_id: postId,
        language_code: targetLang,
        title: manual_translation.title,
        body: manual_translation.body,
        status: 'completed',
        generated_at: new Date().toISOString(),
      }, { onConflict: 'post_id,language_code' })
    } else if (existingTarget?.status !== 'completed') {
      // Translation requires Pro plan
      const isPro = effectiveOwner?.plan === 'pro' || owner?.plan === 'pro'
      if (!isPro) {
        await supabase.from('post_translations').upsert({
          post_id: postId,
          language_code: targetLang,
          title: '',
          body: '',
          status: 'pending_insufficient_balance',
          generated_at: new Date().toISOString(),
        }, { onConflict: 'post_id,language_code' })
      } else {
        await runTranslation({
          supabase,
          ownerId: effectiveOwner?.id ?? owner?.id ?? '',
          postId: postId!,
          title,
          postBody,
          originalLang: original_language,
          targetLang,
        })
      }
    }

    // ── Notification ──────────────────────────────────────────────────
    if (send_notification) {
      // Fetch salon_id from DB — never trust request body (spoofing prevention)
      const { data: postRow } = await supabase
        .from('posts')
        .select('salon_id')
        .eq('id', postId!)
        .single()
      const actualSalonId = postRow?.salon_id ?? salon_id

      // Re-send guard: if this post already has a successful notification record,
      // skip entirely. Prevents double-sends when a published post is re-saved.
      const { count: alreadySent } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId!)
        .eq('status', 'sent')

      if (!alreadySent || alreadySent === 0) {
        const [membersResult, translationsResult, senderAddrResult, salonResult] =
          await Promise.all([
            supabase
              .from('members')
              .select('*')
              .eq('salon_id', actualSalonId)
              .eq('status', 'active'),
            supabase.from('post_translations').select('*').eq('post_id', postId!),
            supabase
              .from('owner_sender_addresses')
              .select('*, owner_sender_domains(*)')
              .eq('owner_id', owner.id)
              .eq('is_default', true)
              .maybeSingle(),
            supabase.from('salons').select('name, notification_language').eq('id', actualSalonId).single(),
          ])

        const members = membersResult.data ?? []
        const translations = translationsResult.data ?? []
        const senderAddr = senderAddrResult.data
        const salonName = salonResult.data?.name ?? ''
        const notifLang = (salonResult.data?.notification_language ?? 'member') as 'member' | 'ja' | 'en'
        const hasCompleted = translations.some((t) => t.status === 'completed')

        if (!hasCompleted) {
          // No sendable translation yet — record failure, owner can retry after charging
          await supabase.from('notifications').insert({
            post_id: postId!,
            salon_id: actualSalonId,
            status: 'failed',
            sent_at: null,
          })
        } else {
          const postObj = {
            id: postId!,
            salon_id: actualSalonId,
            owner_id: owner.id,
            original_language,
            send_notification,
            status,
            cover_image_url: cover_image_url ?? null,
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          const domain = (senderAddr as any)?.owner_sender_domains
          const useCustom = domain?.verification_status === 'verified'

          // Parallel send — allSettled so one failure doesn't abort the rest
          const results = await Promise.allSettled(
            members.map((member) =>
              sendArticleNotification({
                member,
                post: postObj,
                translations,
                salonId: actualSalonId,
                salonName,
                senderAddress: useCustom ? senderAddr : null,
                overrideLang: notifLang === 'member' ? undefined : notifLang,
              })
            )
          )

          // Per-member failure log — kept out of the DB for MVP, but visible in server logs
          results.forEach((result, i) => {
            const failed =
              result.status === 'rejected' ||
              (result.status === 'fulfilled' && !result.value.success)
            if (failed) {
              const m = members[i]
              const reason =
                result.status === 'rejected'
                  ? String(result.reason)
                  : result.value.error ?? 'unknown'
              console.error(
                `[notification] post=${postId} member=${m.id} email=${m.email} error=${reason}`
              )
            }
          })

          const sentCount = results.filter(
            (r) => r.status === 'fulfilled' && r.value.success
          ).length

          await supabase.from('notifications').insert({
            post_id: postId!,
            salon_id: actualSalonId,
            status: sentCount === 0 ? 'failed' : 'sent',
            sent_at: new Date().toISOString(),
          })
        }
      }
    }
  }

  return NextResponse.json({ id: postId })
}

// DELETE /api/posts?id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await getOwner(supabase, user.email!)
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase.from('posts').delete().eq('id', id).eq('owner_id', owner.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// ── Internal helper ───────────────────────────────────────────────────────────

interface RunTranslationParams {
  supabase: Awaited<ReturnType<typeof createServiceClient>>
  ownerId: string
  postId: string
  title: string
  postBody: string
  originalLang: LanguageCode
  targetLang: LanguageCode
}

/**
 * Translate the target language and manage wallet atomically:
 *
 * 1. Estimate cost
 * 2. Deduct balance atomically (fail-fast if insufficient → mark pending)
 * 3. Call OpenAI
 * 4. On success → record consume transaction
 * 5. On failure → refund atomically + record refund transaction + mark failed
 *
 * The balance deduction (step 2) happens BEFORE the translation call (step 3).
 * There is therefore no window where two concurrent requests can both read the
 * same balance and both succeed — the Postgres UPDATE is atomic.
 */
async function runTranslation({
  supabase,
  ownerId,
  postId,
  title,
  postBody,
  originalLang,
  targetLang,
}: RunTranslationParams): Promise<void> {
  const cost = estimateTranslationCost(title + postBody)
  const charCount = title.length + postBody.length

  // Step 2: atomic deduction
  const deductResult = await deductWalletBalance(supabase, ownerId, cost)

  if (!deductResult.success) {
    // Insufficient balance — publish without translation
    await supabase.from('post_translations').upsert({
      post_id: postId,
      language_code: targetLang,
      title: '',
      body: '',
      status: 'pending_insufficient_balance',
      generated_at: new Date().toISOString(),
    }, { onConflict: 'post_id,language_code' })
    return
  }

  // Step 3: translate (balance already deducted)
  try {
    const translated = await translatePost({
      title,
      body: postBody,
      fromLang: originalLang,
      toLang: targetLang,
    })

    await supabase.from('post_translations').upsert({
      post_id: postId,
      language_code: targetLang,
      title: translated.title,
      body: translated.body,
      status: 'completed',
      generated_at: new Date().toISOString(),
    }, { onConflict: 'post_id,language_code' })

    // Step 4: record consume
    await supabase.from('wallet_transactions').insert({
      owner_id: ownerId,
      type: 'consume',
      amount: -cost,
      reference_type: 'translation',
      reference_id: postId,
      note: `翻訳: ${charCount}文字`,
    })
  } catch {
    // Step 5: refund on translation API failure
    await addWalletBalance(supabase, ownerId, cost)
    await supabase.from('wallet_transactions').insert({
      owner_id: ownerId,
      type: 'refund',
      amount: cost,
      reference_type: 'translation',
      reference_id: postId,
      note: `翻訳失敗による返金: ${charCount}文字`,
    })

    await supabase.from('post_translations').upsert({
      post_id: postId,
      language_code: targetLang,
      title: '',
      body: '',
      status: 'failed',
      generated_at: new Date().toISOString(),
    }, { onConflict: 'post_id,language_code' })
  }
}
