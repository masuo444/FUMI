export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { LogoutButton } from '@/components/owner/LogoutButton'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin()

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-4 py-5 border-b border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">管理者</p>
          <h1 className="text-base font-bold mt-1">Fumi Admin</h1>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
        </div>
        <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5">
          <AdminNavLink href="/admin">サロン一覧</AdminNavLink>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <AdminNavLink href="/dashboard">← オーナー画面</AdminNavLink>
          </div>
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}

function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-800 hover:text-white transition-colors"
    >
      {children}
    </Link>
  )
}
