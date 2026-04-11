export type Lang = 'ja' | 'en'

// ── Landing page ─────────────────────────────────────────────────────────────
export const lp = {
  nav: {
    how:      { ja: '使い方',     en: 'How it works' },
    channels: { ja: 'チャンネル', en: 'Channels' },
    pricing:  { ja: '料金',       en: 'Pricing' },
    signin:   { ja: 'ログイン',   en: 'Sign in' },
    start:    { ja: '始める',     en: 'Start' },
  },
  hero: {
    label:    { ja: '会員制メルマガ・配信プラットフォーム', en: 'Newsletter & Membership Platform' },
    title:    { ja: '書けば、\n世界に届く。', en: 'Write once.\nReach everyone.' },
    sub:      { ja: 'どの言語で書いても、AIが翻訳してメルマガとして会員に届きます。\n世界中のクリエイターのための、グローバル配信プラットフォーム。', en: 'Write in any language. Fumi translates your newsletter and delivers it to members worldwide — in their own language.' },
    ctaTrial: { ja: '無料トライアルを始める →', en: 'Start free trial →' },
    ctaMember:{ ja: '会員の方はこちら',          en: 'Sign in as member' },
  },
  how: {
    label:    { ja: '使い方',               en: 'How it works' },
    title:    { ja: '3ステップでグローバルへ', en: 'Three steps to go global' },
    steps: [
      { step: '01', title: { ja: '書く',       en: 'Write'     }, body: { ja: '日本語・英語・その他の言語でメルマガ記事を投稿します。', en: 'Write your newsletter in any language — Japanese, English, or anything else.' } },
      { step: '02', title: { ja: 'AI翻訳',     en: 'Translate' }, body: { ja: 'FumiがAIで自動翻訳。会員の言語に合わせて配信準備が整います。', en: 'Fumi auto-translates your content into each member\'s language using AI.' } },
      { step: '03', title: { ja: 'メルマガ配信', en: 'Send'      }, body: { ja: '会員それぞれの言語で、メールボックスに直接届きます。', en: 'Your newsletter lands directly in each member\'s inbox — in their preferred language.' } },
    ],
  },
  forWho: {
    label:    { ja: '対象ユーザー',                           en: 'Who uses Fumi' },
    title:    { ja: '海外ファンを持つクリエイターのために',      en: 'Built for creators with global audiences' },
    cards: [
      {
        label: { ja: 'クリエイター・アーティスト',   en: 'Creators & Artists' },
        title: { ja: '世界中にファンがいる。届けよう。', en: 'You have fans worldwide. Now reach them.' },
        body:  { ja: 'イラストレーター、音楽家、武道家、作家——言語の壁を超えたところに読者がいるなら、Fumiで会員制チャンネルを持てます。', en: 'Illustrators, musicians, athletes, writers — if your work has crossed language barriers, Fumi helps you deepen those relationships with a members-only channel.' },
        examples: { ja: '漫画家 · 武道インストラクター · 音楽家 · 写真家', en: 'Manga artists · Martial arts instructors · Musicians · Photographers' },
      },
      {
        label: { ja: '文化系コミュニティ',              en: 'Cultural Communities' },
        title: { ja: '日本の文化には、世界的な需要がある。', en: 'Japanese culture has global demand.' },
        body:  { ja: '酒蔵、茶道、工芸スタジオ——海外の愛好家がつながりたい生産者やクリエイターに向けた会員チャンネルを作れます。', en: 'Sake breweries, tea masters, craft studios — build a subscriber base of international enthusiasts who want to follow your craft, month by month.' },
        examples: { ja: '日本酒・焼酎 · アニメ · 伝統工芸 · 茶道', en: 'Sake & shochu · Anime · Traditional crafts · Tea ceremony' },
      },
    ],
  },
  channels: {
    label:    { ja: '参加中のチャンネル',             en: 'Live channels' },
    title:    { ja: 'Fumiのチャンネルを探す',          en: 'Explore communities on Fumi' },
  },
  pricing: {
    label:    { ja: '料金',                        en: 'Pricing' },
    title:    { ja: 'シンプルな料金体系',              en: 'One plan. Everything included.' },
    trialNote:{ ja: '最初の5日間は無料。クレジットカード不要。', en: 'First 5 days free. No credit card required to start.' },
    features: [
      { ja: '会員数・チャンネル数 無制限',       en: 'Unlimited members & channels' },
      { ja: '多言語メルマガ配信',              en: 'Multi-language newsletter delivery' },
      { ja: '自動翻訳（あらゆる言語に対応）',  en: 'Auto-translation (any language)' },
      { ja: 'Stripe自動会員追加Webhook',       en: 'Stripe auto-member-add webhook' },
      { ja: 'いつでもキャンセル可能',          en: 'Cancel anytime' },
    ],
    cta: { ja: '無料トライアルを始める →', en: 'Start free trial →' },
  },
  bottomCta: {
    title:  { ja: 'グローバルへ踏み出そう。', en: 'Ready to go global?' },
    sub:    { ja: '5日間無料。クレジットカード不要。', en: '5 days free. No credit card required.' },
    button: { ja: '無料トライアルを始める →',         en: 'Start your free trial →' },
  },
  footer: {
    tagline:  { ja: '書けば、世界に届く。',    en: 'Write once. Reach everyone.' },
    memberLogin: { ja: '会員ログイン',         en: 'Member sign in' },
    ownerLogin:  { ja: 'オーナーログイン',     en: 'Creator login' },
    newsletter:  { ja: '多言語メルマガ配信',   en: 'Multi-language newsletters' },
  },
} as const

// ── Owner dashboard ───────────────────────────────────────────────────────────
export const owner = {
  nav: {
    dashboard: { ja: 'ダッシュボード',  en: 'Dashboard' },
    posts:     { ja: '記事一覧',        en: 'Posts' },
    newPost:   { ja: '記事を書く',      en: 'New post' },
    members:   { ja: '会員管理',        en: 'Members' },
    wallet:    { ja: '翻訳残高',        en: 'Translation balance' },
    billing:   { ja: 'プラン・請求',    en: 'Plan & billing' },
    settings:  { ja: 'チャンネル設定',  en: 'Channel settings' },
    domain:    { ja: '送信ドメイン',    en: 'Sending domain' },
    admin:     { ja: '管理者',          en: 'Admin' },
  },
  dashboard: {
    title:        { ja: 'ダッシュボード',   en: 'Dashboard' },
    lowBalance:   { ja: '翻訳残高が不足しています', en: 'Translation balance is low' },
    topUp:        { ja: 'チャージする →',  en: 'Top up →' },
    statBalance:  { ja: '翻訳残高',        en: 'Translation balance' },
    statMembers:  { ja: '会員数',          en: 'Members' },
    statUntrans:  { ja: '未翻訳',          en: 'Untranslated' },
    recentPosts:  { ja: '直近の記事',      en: 'Recent posts' },
    viewAll:      { ja: 'すべて見る →',    en: 'View all →' },
    noPosts:      { ja: 'まだ記事がありません', en: 'No posts yet' },
    published:    { ja: '公開',            en: 'Published' },
    draft:        { ja: '下書き',          en: 'Draft' },
  },
  posts: {
    title:     { ja: '記事一覧',         en: 'Posts' },
    newPost:   { ja: '+ 新しい記事',     en: '+ New post' },
    noPosts:   { ja: 'まだ記事がありません。', en: 'No posts yet.' },
    writeFirst:{ ja: '最初の記事を書く', en: 'Write your first post' },
    published: { ja: '公開',             en: 'Published' },
    draft:     { ja: '下書き',           en: 'Draft' },
    lowBal:    { ja: '残高不足',         en: 'low balance' },
    error:     { ja: 'エラー',           en: 'error' },
    edit:      { ja: '編集',             en: 'Edit' },
    view:      { ja: '表示',             en: 'View' },
  },
  members: {
    title: { ja: '会員管理', en: 'Members' },
  },
  wallet: {
    title:   { ja: '翻訳残高',                         en: 'Translation balance' },
    charged: { ja: 'チャージが完了しました。',          en: 'Top-up complete. Your balance has been updated.' },
  },
  settings: {
    title: { ja: 'チャンネル設定',                          en: 'Channel settings' },
    sub:   { ja: 'サロン名・説明・外部決済リンクを編集できます。', en: 'Edit your channel name, description, and payment link.' },
  },
  billing: {
    title:          { ja: 'プラン・請求',     en: 'Plan & billing' },
    upgraded:       { ja: 'Proプランへのアップグレードが完了しました。全機能が利用可能です。', en: "You're now on the Pro plan. All features are unlocked." },
    trialDaysLeft:  { ja: (n: number) => `無料トライアル残り${n}日`, en: (n: number) => `${n} day${n !== 1 ? 's' : ''} left in your free trial` },
    trialEnds:      { ja: (d: string) => `${d}までに購読してください。`, en: (d: string) => `Subscribe before ${d} to keep access.` },
    trialExpired:   { ja: '無料トライアルが終了しました。Fumiを続けるには購読してください。', en: 'Your free trial has ended. Subscribe to continue using Fumi.' },
    backToDash:     { ja: 'ダッシュボードに戻る', en: 'Back to dashboard' },
    currentPlan:    { ja: '現在のプラン',         en: 'Current plan' },
    planFreeT:      { ja: '無料トライアル',        en: 'Free trial' },
    planExpired:    { ja: '期限切れ',             en: 'Expired' },
    nextRenewal:    { ja: '次回更新日',            en: 'Next renewal' },
    proDesc:        { ja: '全機能が有効です — 会員無制限、自動翻訳、Stripe連携。', en: 'All features active — unlimited members, auto-translation, Stripe integration.' },
    manageStripe:   { ja: 'プランを管理（Stripeポータル）', en: 'Manage subscription (Stripe portal)' },
    features: [
      { ja: '会員数・チャンネル数 無制限',     en: 'Unlimited members & channels' },
      { ja: '自動翻訳（あらゆる言語に対応）', en: 'Auto-translation (any language)' },
      { ja: 'Stripe自動会員追加Webhook',     en: 'Stripe auto-member-add webhook' },
      { ja: '多言語メール配信',              en: 'Multi-language email delivery' },
    ],
    subscribeBtn:   { ja: '購読する — $10 / 月', en: 'Subscribe — $10 / month' },
    noSetupFee:     { ja: 'いつでもキャンセル可。初期費用なし。', en: 'Cancel anytime. No setup fee.' },
    webhookTitle:   { ja: 'Stripe 自動会員追加',   en: 'Stripe auto-member-add' },
    webhookDesc:    { ja: 'Stripeと連携して、チェックアウト完了時に自動で会員を追加します。', en: 'Connect your Stripe account to automatically add members when a checkout completes.' },
    webhookUrlLabel:{ ja: 'Webhook URL — StripeのDashboardに貼り付けてください', en: 'Webhook URL — paste into your Stripe Dashboard' },
    copyBtn:        { ja: 'コピー', en: 'Copy' },
    copiedBtn:      { ja: 'コピー済み！', en: 'Copied!' },
    listenFor:      { ja: '受信イベント：', en: 'Listen for:' },
    removeBtn:      { ja: '連携を解除', en: 'Remove integration' },
    removingBtn:    { ja: '削除中…',   en: 'Removing…' },
    secretLabel:    { ja: 'Webhook Signing Secretを入力してください（whsec_...）', en: 'Enter your Stripe Webhook Signing Secret (whsec_...)' },
    saveBtn:        { ja: '保存',     en: 'Save' },
    savingBtn:      { ja: '保存中…', en: 'Saving…' },
  },
} as const

// ── Member-facing pages ───────────────────────────────────────────────────────
export const member = {
  login: {
    membersOnly: { ja: '会員専用',        en: 'Members Only' },
    title:       { ja: '会員ログイン',    en: 'Member login' },
    sub:         { ja: '登録済みのメールアドレスに、ログインリンクをお送りします。', en: "Enter your email and we'll send you a magic link." },
    emailLabel:  { ja: 'メールアドレス',  en: 'Email address' },
    sendBtn:     { ja: 'ログインリンクを送る', en: 'Send magic link' },
    sendingBtn:  { ja: '確認中...',        en: 'Sending...' },
    back:        { ja: '← 戻る',          en: '← Back' },
    sentTitle:   { ja: 'メールを送信しました', en: 'Check your email' },
    sentBody:    { ja: (email: string) => `${email} にログインリンクをお送りしました。メール内のリンクをクリックしてください。`, en: (email: string) => `We sent a login link to ${email}. Click the link in the email to sign in.` },
    spamNote:    { ja: 'メールが届かない場合は、迷惑メールフォルダをご確認ください。', en: "Can't find it? Check your spam folder." },
  },
  myPage: {
    title:        { ja: '参加中のチャンネル', en: 'My Subscriptions' },
    label:        { ja: 'マイページ',         en: 'My Subscriptions' },
    empty:        { ja: 'まだ参加しているチャンネルはありません。', en: "You haven't joined any channels yet." },
    browseBtn:    { ja: 'チャンネルを探す →', en: 'Browse channels →' },
  },
  myLogin: {
    label:    { ja: '会員ポータル',     en: 'Member Portal' },
    title:    { ja: 'ログイン',         en: 'Sign in' },
    sub:      { ja: 'メールアドレスを入力すると、マジックリンクをお送りします。参加中のチャンネルにアクセスできます。', en: "Enter your email and we'll send you a magic link to access all your subscriptions." },
    emailLabel:{ ja: 'メールアドレス', en: 'Email address' },
    sendBtn:  { ja: 'マジックリンクを送る', en: 'Send magic link' },
    sendingBtn:{ ja: '送信中...',          en: 'Sending...' },
    sentTitle:{ ja: 'メールを確認してください', en: 'Check your email' },
    sentBody: { ja: (email: string) => `${email} にログインリンクをお送りしました。`, en: (email: string) => `We sent a login link to ${email}. Click the link in the email to sign in.` },
    spamNote: { ja: '届かない場合は迷惑メールフォルダをご確認ください。', en: "Can't find it? Check your spam folder." },
    noAccount:{ ja: 'アカウントをお持ちでない方は', en: "Don't have an account?" },
    browseLink:{ ja: 'チャンネル一覧', en: 'Browse channels' },
    errorMsg: { ja: 'メールの送信に失敗しました。再度お試しください。', en: 'Failed to send email. Please try again.' },
  },
} as const

// ── Helper ────────────────────────────────────────────────────────────────────
export function tx<T extends { ja: string; en: string }>(entry: T, lang: Lang): string {
  return entry[lang]
}
