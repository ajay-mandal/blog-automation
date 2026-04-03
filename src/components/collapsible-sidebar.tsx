"use client"
// 'use client' — needs useState for collapse toggle

import { useState } from "react"
import { logoutAction } from "@/lib/auth"
import { NavItem } from "@/components/nav-item"
import { Bot, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react"

const NAV_ITEMS = [
  { href: "/sources", label: "Sources", icon: "rss" },
  { href: "/feed", label: "Feed", icon: "newspaper" },
  { href: "/blogs", label: "Blogs", icon: "file-text" },
] as const

export function CollapsibleSidebar() {
  const [open, setOpen] = useState(true)

  return (
    <aside
      className={`glass-sidebar relative flex shrink-0 flex-col transition-all duration-300 ease-in-out ${
        open ? "w-[220px]" : "w-[52px]"
      }`}
    >
      {/* Logo + toggle */}
      <div
        className={`flex h-14 shrink-0 items-center gap-2 px-3 ${open ? "justify-between" : "justify-center"}`}
      >
        {open && (
          <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#3b82f6]/20 ring-1 ring-[#3b82f6]/30">
              <Bot className="size-4 text-[#60a5fa]" />
            </div>
            <span className="truncate text-sm font-semibold tracking-[-0.01em] text-[#e2e8f8]">
              Blog Auto
            </span>
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#8ba3cc] transition-colors hover:bg-white/8 hover:text-white/80"
        >
          {open ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
        </button>
      </div>

      {/* Divider */}
      <div className="mx-3 h-px bg-white/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} collapsed={!open} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mx-3 h-px bg-white/[0.06]" />
      <div className="space-y-0.5 px-2 py-3">
        <NavItem href="/settings" label="Settings" icon="settings" collapsed={!open} />
        <form action={logoutAction}>
          <button
            type="submit"
            title="Sign out"
            className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#8ba3cc] transition-all duration-150 hover:bg-white/[0.06] hover:text-[#e2e8f8] ${
              !open ? "justify-center" : ""
            }`}
          >
            <LogOut className="size-4 shrink-0" />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                open ? "w-auto opacity-100" : "w-0 opacity-0"
              }`}
            >
              Sign out
            </span>
          </button>
        </form>
      </div>
    </aside>
  )
}
