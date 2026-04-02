"use client"
// 'use client' — needs usePathname for active nav state

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

type NavItemProps = {
  href: string
  label: string
  icon: LucideIcon
}

export function NavItem({ href, label, icon: Icon }: NavItemProps) {
  const pathname = usePathname()
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 ${
        isActive ? "nav-active" : "text-[#8ba3cc] hover:bg-white/[0.06] hover:text-[#e2e8f8]"
      }`}
    >
      <Icon
        className={`size-4 shrink-0 transition-colors duration-150 ${
          isActive ? "text-[#60a5fa]" : "text-[#8ba3cc] group-hover:text-[#e2e8f8]"
        }`}
      />
      {label}
    </Link>
  )
}
