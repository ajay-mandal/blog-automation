"use client"
// 'use client' — needs usePathname for active nav state

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Newspaper, Rss, Settings } from "lucide-react"
import type { LucideIcon } from "lucide-react"

// Icon registry — all icon strings must be resolved here, not passed as objects
const ICON_MAP: Record<string, LucideIcon> = {
  rss: Rss,
  newspaper: Newspaper,
  "file-text": FileText,
  settings: Settings,
}

type NavItemProps = {
  href: string
  label: string
  /** Kebab-case icon name from ICON_MAP, e.g. "rss", "file-text" */
  icon: string
  /** When true, hide the label (icon-only mode for collapsed sidebar) */
  collapsed?: boolean
}

export function NavItem({ href, label, icon, collapsed }: NavItemProps) {
  const pathname = usePathname()
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
  const Icon = ICON_MAP[icon]

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 ${
        collapsed ? "justify-center" : ""
      } ${isActive ? "nav-active" : "text-[#8ba3cc] hover:bg-white/[0.06] hover:text-[#e2e8f8]"}`}
    >
      {Icon && (
        <Icon
          className={`size-4 shrink-0 transition-colors duration-150 ${
            isActive ? "text-[#60a5fa]" : "text-[#8ba3cc] group-hover:text-[#e2e8f8]"
          }`}
        />
      )}
      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        }`}
      >
        {label}
      </span>
    </Link>
  )
}
