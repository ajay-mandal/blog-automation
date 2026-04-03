import { CollapsibleSidebar } from "@/components/collapsible-sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <CollapsibleSidebar />
      {/* Main content area */}
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  )
}
