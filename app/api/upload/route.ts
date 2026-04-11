import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_DIMENSION = 2000   // px — long edge capped here
const JPEG_QUALITY  = 82     // 0-100, 82 is visually near-lossless for photos
const WEBP_QUALITY  = 82

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const bucket = (formData.get('bucket') as string) ?? 'post-images'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const originalBuffer = Buffer.from(await file.arrayBuffer())

  // Compress and resize — output as WebP for best size/quality ratio
  let compressed: Buffer
  try {
    compressed = await sharp(originalBuffer)
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    // Fall back to JPEG if WebP ends up larger (rare but possible for already-compressed PNGs)
    if (compressed.byteLength > originalBuffer.byteLength) {
      compressed = await sharp(originalBuffer)
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer()
    }
  } catch {
    // If sharp can't process the format (SVG, etc.), upload as-is
    compressed = originalBuffer
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
  const path = `${user.id}/${fileName}`
  const contentType = 'image/webp'

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, compressed, { contentType, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
