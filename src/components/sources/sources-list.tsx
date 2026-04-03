"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  Loader2,
  Globe,
  Tag,
  Clock,
  RefreshCw,
  MoreVertical,
  Pause,
  Play,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type Source = {
  id: string
  name: string
  url: string
  siteUrl: string | null
  category: string | null
  active: boolean
  lastFetchedAt: Date | string | null
  createdAt: Date | string
  _count: { articles: number }
}

export function SourcesList({ sources }: { sources: Source[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [fetchingId, setFetchingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function fetchSource(id: string, name: string) {
    setFetchingId(id)
    try {
      const res = await fetch(`/api/sources/${id}/fetch`, { method: "POST" })
      if (!res.ok) {
        toast.error(`Failed to fetch "${name}"`)
        return
      }
      const { created, fetched } = (await res.json()) as { created: number; fetched: number }
      toast.success(
        `${name}: ${created} new article${created !== 1 ? "s" : ""} (${fetched} in feed)`
      )
      router.refresh()
    } finally {
      setFetchingId(null)
    }
  }

  async function toggleActive(id: string, name: string, currentActive: boolean) {
    setTogglingId(id)
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      })
      if (!res.ok) {
        toast.error("Failed to update source")
        return
      }
      toast.success(`"${name}" ${!currentActive ? "activated" : "paused"}`)
      router.refresh()
    } finally {
      setTogglingId(null)
    }
  }

  async function deleteSource(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will also remove all fetched articles.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/sources/${id}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Failed to delete source")
        return
      }
      toast.success(`"${name}" removed`)
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  if (sources.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#050b15]/40 p-12 text-center">
        <p className="text-sm text-[#3a5070]">
          No sources yet. Add a blog or RSS feed URL to get started.
        </p>
      </div>
    )
  }

  const activeSources = sources.filter((s) => s.active)
  const pausedSources = sources.filter((s) => !s.active)

  return (
    <div className="space-y-6">
      {activeSources.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold tracking-wider text-[#3a5070] uppercase">
            Active Sources
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeSources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                onFetch={fetchSource}
                onToggle={toggleActive}
                onDelete={deleteSource}
                isFetching={fetchingId === source.id}
                isDeleting={deletingId === source.id}
                isToggling={togglingId === source.id}
              />
            ))}
          </div>
        </div>
      )}

      {pausedSources.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold tracking-wider text-[#3a5070] uppercase">
            Paused Sources
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pausedSources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                onFetch={fetchSource}
                onToggle={toggleActive}
                onDelete={deleteSource}
                isFetching={fetchingId === source.id}
                isDeleting={deletingId === source.id}
                isToggling={togglingId === source.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

type SourceCardProps = {
  source: Source
  onFetch: (id: string, name: string) => Promise<void>
  onToggle: (id: string, name: string, currentActive: boolean) => Promise<void>
  onDelete: (id: string, name: string) => Promise<void>
  isFetching: boolean
  isDeleting: boolean
  isToggling: boolean
}

function SourceCard({
  source,
  onFetch,
  onToggle,
  onDelete,
  isFetching,
  isDeleting,
  isToggling,
}: SourceCardProps) {
  const isLoading = isFetching || isDeleting || isToggling
  const lastFetchDate = source.lastFetchedAt
    ? new Date(source.lastFetchedAt).toLocaleDateString()
    : "Never"

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border bg-gradient-to-br p-4 transition-all duration-200 ${
        source.active
          ? "border-white/[0.08] bg-[#050b15]/60 hover:border-white/[0.12] hover:bg-[#050b15]/80"
          : "border-white/[0.04] bg-[#050b15]/30 opacity-60"
      }`}
    >
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="relative flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold text-white/90">{source.name}</h4>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                source.active ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/30"
              }`}
            >
              {source.active ? "Active" : "Paused"}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={isLoading}
                className="inline-flex size-7 items-center justify-center rounded-md p-0 text-[#5577aa] transition-colors hover:bg-white/5 hover:text-white/60 disabled:pointer-events-none disabled:opacity-50"
              >
                <MoreVertical className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => onToggle(source.id, source.name, source.active)}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  {source.active ? (
                    <>
                      <Pause className="mr-2 size-3.5" />
                      Pause source
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 size-3.5" />
                      Resume source
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(source.id, source.name)}
                  disabled={isLoading}
                  className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
                >
                  <Trash2 className="mr-2 size-3.5" />
                  Delete source
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Category */}
        {source.category && (
          <div className="flex items-center gap-1">
            <Tag className="size-3 text-[#3a5070]" />
            <span className="text-[10px] text-[#3a5070]">{source.category}</span>
          </div>
        )}

        {/* URL */}
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group/link flex items-center gap-1 truncate text-[11px] text-[#5577aa] transition-colors hover:text-blue-400"
          title={source.url}
        >
          <Globe className="size-3 shrink-0" />
          <span className="truncate">{source.url}</span>
        </a>

        {/* Stats */}
        <div className="space-y-1 border-t border-white/[0.05] pt-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#3a5070]">Articles</span>
            <span className="font-semibold text-white/60">{source._count.articles}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-[#3a5070]">
              <Clock className="size-2.5" />
              Last fetch
            </span>
            <span className="font-mono text-white/50">{lastFetchDate}</span>
          </div>
        </div>

        {/* Action button */}
        <Button
          onClick={() => onFetch(source.id, source.name)}
          disabled={isLoading || !source.active}
          className="h-7 w-full gap-1 bg-blue-500/10 text-[11px] font-medium text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
        >
          {isFetching ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              Fetching...
            </>
          ) : (
            <>
              <RefreshCw className="size-3" />
              Fetch now
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
