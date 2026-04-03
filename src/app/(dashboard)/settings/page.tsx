import { AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-react"
import { getApiKeyStatus, getConfiguredModelIds } from "@/lib/api-key-status"

export default function SettingsPage() {
  const statuses = getApiKeyStatus()
  const aiProviders = statuses.filter((s) => s.models)
  const serviceProviders = statuses.filter((s) => !s.models)
  const configuredModels = getConfiguredModelIds(statuses)
  const hasNoAiKeys = aiProviders.every((s) => !s.configured)
  const hasNoImageKeys = serviceProviders
    .filter((s) => s.id === "unsplash" || s.id === "pexels")
    .every((s) => !s.configured)
  const portfolioConfigured = statuses.find((s) => s.id === "portfolio")?.configured ?? false

  return (
    <div className="flex flex-col">
      <div className="page-header px-6 py-5">
        <h1 className="text-gradient-blue text-xl font-semibold tracking-[-0.02em]">Settings</h1>
        <p className="mt-0.5 text-sm text-[#8ba3cc]">API key status and portfolio integration</p>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* ── Warning banners ─── */}
        {hasNoAiKeys && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-300">No AI provider configured</p>
              <p className="mt-0.5 text-xs text-amber-400/80">
                At least one of OpenAI, Anthropic, or Google AI keys is required to generate blogs.
                Add the key to <code className="font-mono">.env.local</code> and restart the dev
                server.
              </p>
            </div>
          </div>
        )}

        {!portfolioConfigured && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-300">
                Portfolio publishing not configured
              </p>
              <p className="mt-0.5 text-xs text-amber-400/80">
                Set <code className="font-mono">PORTFOLIO_SUPABASE_URL</code> and{" "}
                <code className="font-mono">PORTFOLIO_SUPABASE_SERVICE_ROLE_KEY</code> to publish
                blogs to ajaymandal.com.
              </p>
            </div>
          </div>
        )}

        {hasNoImageKeys && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-300">No image search keys configured</p>
              <p className="mt-0.5 text-xs text-blue-400/80">
                Unsplash or Pexels keys enable stock photo search. DALL-E 3 image generation still
                works if OpenAI is configured.
              </p>
            </div>
          </div>
        )}

        {/* ── AI Providers ─── */}
        <section>
          <h2 className="mb-3 text-xs font-semibold tracking-widest text-[#5577aa] uppercase">
            AI Providers
          </h2>
          <div className="glass divide-y divide-white/5 overflow-hidden rounded-xl">
            {aiProviders.map((provider) => (
              <div key={provider.id} className="flex items-start gap-4 px-5 py-4">
                <div className="mt-0.5">
                  {provider.configured ? (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  ) : (
                    <XCircle className="size-4 text-red-400/70" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/90">{provider.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                        provider.configured
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {provider.configured ? "Configured" : "Missing"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#8ba3cc]">{provider.usedFor}</p>
                  <p className="mt-1 font-mono text-[11px] text-[#5577aa]">{provider.envVar}</p>

                  {/* Available models */}
                  {provider.models && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {provider.models.map((model) => {
                        const available = configuredModels.includes(model.id)
                        return (
                          <span
                            key={model.id}
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                              available
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : "border-white/10 bg-white/5 text-white/30 line-through"
                            }`}
                          >
                            {model.label}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Services ─── */}
        <section>
          <h2 className="mb-3 text-xs font-semibold tracking-widest text-[#5577aa] uppercase">
            Services
          </h2>
          <div className="glass divide-y divide-white/5 overflow-hidden rounded-xl">
            {serviceProviders.map((provider) => (
              <div key={provider.id} className="flex items-start gap-4 px-5 py-4">
                <div className="mt-0.5">
                  {provider.configured ? (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  ) : (
                    <XCircle className="size-4 text-red-400/70" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/90">{provider.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                        provider.configured
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {provider.configured ? "Configured" : "Missing"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#8ba3cc]">{provider.usedFor}</p>
                  <p className="mt-1 font-mono text-[11px] text-[#5577aa]">{provider.envVar}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How to configure ─── */}
        <div className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-[#5577aa]" />
          <p className="text-xs text-[#8ba3cc]">
            Keys are read from <code className="font-mono text-[#7799bb]">.env.local</code> at
            server start. After adding or changing a key, restart the dev server (
            <code className="font-mono text-[#7799bb]">npm run dev</code>) for changes to take
            effect.
          </p>
        </div>
      </div>
    </div>
  )
}
