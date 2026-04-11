import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { translatePost, estimateTranslationCost } from '@/lib/claude'
import { deductWalletBalance, addWalletBalance } from '@/lib/wallet'
import { LanguageCode } from '@/types'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const supabase = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: owner } = await supabase
    .from('owners')
    .select('id, plan')
    .eq('email', user.email!)
    .single()
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
  if (owner.plan !== 'pro') {
    return NextResponse.json({ error: 'Pro plan required for translation' }, { status: 403 })
  }

  // Post の所有権確認 + 原文取得
  const { data: post } = await supabase
    .from('posts')
    .select('id, owner_id, original_language, status')
    .eq('id', postId)
    .eq('owner_id', owner.id)
    .single()
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.status !== 'published') {
    return NextResponse.json({ error: '公開済み記事のみ再翻訳できます' }, { status: 400 })
  }

  // 原文翻訳レコード取得
  const { data: originalTranslation } = await supabase
    .from('post_translations')
    .select('title, body')
    .eq('post_id', postId)
    .eq('language_code', post.original_language)
    .single()
  if (!originalTranslation) {
    return NextResponse.json({ error: '原文が見つかりません' }, { status: 404 })
  }

  const targetLang: LanguageCode = post.original_language === 'ja' ? 'en' : 'ja'

  // Guard: already completed → refuse re-translate
  const { data: existingTarget } = await supabase
    .from('post_translations')
    .select('status')
    .eq('post_id', postId)
    .eq('language_code', targetLang)
    .maybeSingle()

  if (existingTarget?.status === 'completed') {
    return NextResponse.json({ error: '既に翻訳済みです' }, { status: 400 })
  }

  const cost = estimateTranslationCost(originalTranslation.title + originalTranslation.body)
  const charCount = originalTranslation.title.length + originalTranslation.body.length

  // Atomic deduction — if insufficient the balance is untouched and we return 402
  const deductResult = await deductWalletBalance(supabase, owner.id, cost)

  if (!deductResult.success) {
    const { data: wallet } = await supabase
      .from('owner_wallets')
      .select('balance')
      .eq('owner_id', owner.id)
      .single()
    return NextResponse.json(
      {
        error: '残高不足です',
        required: cost,
        current_balance: wallet?.balance ?? 0,
      },
      { status: 402 }
    )
  }

  // Balance already deducted — attempt translation
  try {
    const translated = await translatePost({
      title: originalTranslation.title,
      body: originalTranslation.body,
      fromLang: post.original_language,
      toLang: targetLang,
    })

    await supabase.from('post_translations').upsert(
      {
        post_id: postId,
        language_code: targetLang,
        title: translated.title,
        body: translated.body,
        status: 'completed',
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'post_id,language_code' }
    )

    await supabase.from('wallet_transactions').insert({
      owner_id: owner.id,
      type: 'consume',
      amount: -cost,
      reference_type: 'translation',
      reference_id: postId,
      note: `再翻訳: ${charCount}文字`,
    })

    return NextResponse.json({
      success: true,
      cost,
      remaining_balance: deductResult.newBalance,
    })
  } catch (err) {
    // Refund atomically on translation API failure
    await addWalletBalance(supabase, owner.id, cost)
    await supabase.from('wallet_transactions').insert({
      owner_id: owner.id,
      type: 'refund',
      amount: cost,
      reference_type: 'translation',
      reference_id: postId,
      note: `翻訳失敗による返金: ${charCount}文字`,
    })

    await supabase.from('post_translations').upsert(
      {
        post_id: postId,
        language_code: targetLang,
        title: '',
        body: '',
        status: 'failed',
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'post_id,language_code' }
    )
    return NextResponse.json({ error: '翻訳に失敗しました', detail: String(err) }, { status: 500 })
  }
}
