'use client'
import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { owner, tx, type Lang } from '@/lib/i18n'

export function OwnerNav({ isAdmin, lang }: { isAdmin: boolean; lang: Lang }) {
  const searchParams = useSearchParams()
  const salonParam = searchParams.get('salon')
  const suffix = salonParam ? `?salon=${salonParam}` : ''
  const n = owner.nav

  return (
    <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5">
      <NavLink href={`/dashboard${suffix}`}>{tx(n.dashboard, lang)}</NavLink>
      <NavLink href={`/posts${suffix}`}>{tx(n.posts, lang)}</NavLink>
      <NavLink href={`/posts/new${suffix}`}>{tx(n.newPost, lang)}</NavLink>
      <NavLink href={`/members${suffix}`}>{tx(n.members, lang)}</NavLink>
      <NavLink href="/wallet">{tx(n.wallet, lang)}</NavLink>
      <NavLink href="/billing">{tx(n.billing, lang)}</NavLink>
      <div className="mt-2 pt-2 border-t border-gray-100">
        <NavLink href={`/settings${suffix}`}>{tx(n.settings, lang)}</NavLink>
        <NavLink href="/domains">{tx(n.domain, lang)}</NavLink>
      </div>
      {isAdmin && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <NavLink href="/admin">{tx(n.admin, lang)}</NavLink>
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const hrefPath = href.split('?')[0]
  const isActive = pathname === hrefPath

  return (
    <Link
      href={href}
      className={`px-3 py-2 text-sm rounded-md transition-colors ${
        isActive
          ? 'bg-gray-100 text-gray-900 font-medium'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </Link>
  )
}
