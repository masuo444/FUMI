# Fumi

会員制サロン記事プラットフォーム。複数のオーナーがサロンを立ち上げ、記事を投稿し、会員に日英2言語で届けられます。

## 機能

- **マルチテナント**: 複数オーナーが独立してサロンを持てる
- **記事投稿**: Markdown記法、アイキャッチ・本文画像対応
- **日英翻訳**: 投稿時に1回だけOpenAI APIで自動翻訳・保存
- **翻訳残高**: Stripeでチャージ。残高消費を記録
- **メール通知**: 新着記事をResendで送信（画像なし・軽量）
- **会員管理**: 1件ずつ追加 / CSVインポート / active・inactive切替
- **独自送信ドメイン**: Resend DNS認証済みドメインで送信
- **サロン会費**: プラットフォームでは受け取らない（外部決済リンク）

## セットアップ

### 1. 環境変数

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して各サービスのキーを入力。

### 2. Supabase

- Supabaseプロジェクトを作成
- `supabase/migrations/001_initial.sql` をSQL Editorで実行
- Storage バケット `post-images` を作成（Public）

### 3. 依存インストール & 起動

```bash
npm install
npm run dev
```

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロント | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS |
| DB・Auth・Storage | Supabase |
| メール | Resend |
| 決済 | Stripe（翻訳クレジットのみ） |
| 翻訳 | OpenAI GPT-4o-mini |

## 画面構成

### オーナー管理画面（要ログイン）
| パス | 概要 |
|---|---|
| `/dashboard` | ダッシュボード（残高・会員数・未翻訳数） |
| `/posts` | 記事一覧 |
| `/posts/new` | 記事作成 |
| `/posts/[id]/edit` | 記事編集 |
| `/members` | 会員管理・CSV一括登録 |
| `/wallet` | 翻訳残高・Stripeチャージ・履歴 |
| `/domains` | 送信元ドメイン設定 |

### ユーザー向け（公開）
| パス | 概要 |
|---|---|
| `/salon/[salonId]` | サロン記事一覧（カード型） |
| `/salon/[salonId]/[postId]` | 記事詳細（日英切替） |

## Phase対応状況

| Phase | 機能 | 状態 |
|---|---|---|
| 1 | DBスキーマ・認証・記事CRUD・会員管理 | ✅ |
| 2 | 日英翻訳・翻訳残高・メール通知 | ✅ |
| 3 | 独自送信ドメイン・Stripeチャージ・CSV | ✅ |
