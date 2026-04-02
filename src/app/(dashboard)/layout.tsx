import Link from "next/link"
import { logoutAction } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Rss, Newspaper, Bot, FileText, Settings, LayoutDashboard, LogOut } from "lucide-react"

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sources", label: "Sources", icon: Rss },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/blogs", label: "Blogs", icon: FileText },
] as const

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r bg-sidebar">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Bot className="size-5 shrink-0" />
          <span className="truncate text-sm font-semibold">Blog Automation</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="space-y-1 border-t p-2">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="size-4 shrink-0" />
            Settings
          </Link>
          <Separator className="my-1" />
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 text-muted-foreground"
            >
              <LogOut className="size-4 shrink-0" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
