"use client"

// Client component: manages filter state via URL search params

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback, useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"

const STATUSES = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "selected", label: "Selected" },
  { value: "ignored", label: "Ignored" },
]

type Source = { id: string; name: string }

type FeedFiltersProps = {
  sources: Source[]
}

export function FeedFilters({ sources }: FeedFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "")
  // Ref so the debounce timer reads the latest searchParams without being a dependency
  const searchParamsRef = useRef(searchParams)

  // Update ref outside of render using useEffect
  useEffect(() => {
    searchParamsRef.current = searchParams
  }, [searchParams])

  const currentStatus = searchParams.get("status") ?? ""
  const currentSource = searchParams.get("sourceId") ?? ""

  // Debounce search input — only re-runs when the typed value changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString())
      if (searchInput.trim()) {
        params.set("q", searchInput.trim())
      } else {
        params.delete("q")
      }
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, router, pathname])

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#3a5070]" />
        <input
          type="text"
          placeholder="Search by title or topic..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-8 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pr-8 pl-8 text-xs text-white/80 transition-colors placeholder:text-[#3a5070] focus:border-blue-500/30 focus:bg-white/[0.06] focus:outline-none"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#3a5070] transition-colors hover:text-white/50"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status filter */}
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] p-1">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => update("status", s.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                currentStatus === s.value
                  ? "bg-blue-500/20 text-blue-300"
                  : "text-[#7a99bb] hover:text-white/70"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Source filter */}
        {sources.length > 0 && (
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] p-1">
            <button
              onClick={() => update("sourceId", "")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                currentSource === ""
                  ? "bg-blue-500/20 text-blue-300"
                  : "text-[#7a99bb] hover:text-white/70"
              }`}
            >
              All sources
            </button>
            {sources.map((src) => (
              <button
                key={src.id}
                onClick={() => update("sourceId", src.id)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  currentSource === src.id
                    ? "bg-blue-500/20 text-blue-300"
                    : "text-[#7a99bb] hover:text-white/70"
                }`}
              >
                {src.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
