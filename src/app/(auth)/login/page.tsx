// 'use client' — needs form state and interaction
"use client"

import { useActionState } from "react"
import { Bot } from "lucide-react"
import { loginAction } from "@/lib/auth"
import type { ActionResult } from "@/types"

const initialState: ActionResult = { success: true, data: undefined }

export default function LoginPage() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(loginAction, initialState)

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[20%] left-[10%] h-[500px] w-[500px] rounded-full bg-[#1e3a8a] opacity-20 blur-[100px]" />
        <div className="absolute top-[50%] right-[10%] h-[400px] w-[400px] rounded-full bg-[#3b82f6] opacity-10 blur-[120px]" />
      </div>

      {/* Glass card */}
      <div className="glass relative w-full max-w-[380px] rounded-xl p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#3b82f6]/15 ring-1 ring-[#3b82f6]/25">
            <Bot className="size-6 text-[#60a5fa]" />
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#e2e8f8]">
              Blog Automation
            </h1>
            <p className="text-sm text-[#8ba3cc]">Enter your password to continue</p>
          </div>
        </div>

        {/* Form */}
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium tracking-[0.06em] text-[#8ba3cc] uppercase"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-md border border-white/[0.08] bg-white/[0.05] px-3 py-2.5 text-sm text-[#e2e8f8] transition-all duration-150 outline-none placeholder:text-[#4a6080] focus:border-[#3b82f6]/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#3b82f6]/20"
            />
          </div>

          {!state.success && (
            <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="glow-blue mt-2 w-full cursor-pointer rounded-md bg-[#3b82f6] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#3b82f6]/50 focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  )
}
