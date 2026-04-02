'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, Calendar, BarChart2, User, BadgeCheck } from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/verified', label: 'Verified', icon: BadgeCheck },
  { href: '/report', label: 'Report', icon: BarChart2 },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 z-50 h-[60px]">
      <div className="flex items-stretch h-full">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 gap-0.5 min-h-[44px] transition-colors',
                isActive
                  ? 'text-[#0F4C81]'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={clsx('text-[10px] font-medium', isActive ? 'text-[#0F4C81]' : 'text-gray-400')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
