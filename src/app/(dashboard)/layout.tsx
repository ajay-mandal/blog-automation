import { logoutAction } from "@/lib/auth"
import { NavItem } from "@/components/nav-item"
import { Bot, FileText, LogOut, Newspaper, Rss, Settings } from "lucide-react"

const NAV_ITEMS = [
  { href: "/sources", label: "Sources", icon: Rss },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/blogs", label: "Blogs", icon: FileText },
] as const

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — glass-sidebar */}
      <aside className="glass-sidebar relative flex w-[220px] shrink-0 flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 px-4">
          <div className="flex size-7 items-center justify-center rounded-md bg-[#3b82f6]/20 ring-1 ring-[#3b82f6]/30">
            <Bot className="size-4 text-[#60a5fa]" />
          </div>
          <span className="text-sm font-semibold tracking-[-0.01em] text-[#e2e8f8]">
            Blog Automation
          </span>
        </div>

        {/* Divider */}
        <div className="mx-3 h-px bg-white/[0.06]" />

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="mx-3 h-px bg-white/[0.06]" />
        <div className="space-y-0.5 px-2 py-3">
          <NavItem href="/settings" label="Settings" icon={Settings} />
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#8ba3cc] transition-all duration-150 hover:bg-white/[0.06] hover:text-[#e2e8f8]"
            >
              <LogOut className="size-4 shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  )
}
