"use client"

// Pipeline visualization component showing blog generation flow

import { FileText, Image, Sparkles, CheckCircle2, type LucideIcon } from "lucide-react"

type PipelineStep = "article" | "draft" | "image" | "published"

const STEPS: Array<{ id: PipelineStep; label: string; description: string; icon: LucideIcon }> = [
  {
    id: "article",
    label: "Article",
    description: "Source selected",
    icon: FileText,
  },
  {
    id: "draft",
    label: "Draft",
    description: "AI-generated content",
    icon: Sparkles,
  },
  {
    id: "image",
    label: "Image",
    description: "Cover image generated",
    icon: Image,
  },
  {
    id: "published",
    label: "Published",
    description: "Live on portfolio",
    icon: CheckCircle2,
  },
]

export function BlogPipeline({
  currentStep,
}: {
  currentStep: PipelineStep
  status: "draft" | "reviewed" | "published"
}) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      {STEPS.map((step, index) => {
        const isActive = index <= currentIndex
        const isCurrent = step.id === currentStep
        const Icon = step.icon

        return (
          <div key={step.id} className="flex flex-1 flex-col items-center">
            {/* Step circle */}
            <div
              className={`flex size-10 items-center justify-center rounded-full border-2 transition-all ${
                isCurrent
                  ? "border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/30"
                  : isActive
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : "border-white/[0.08] bg-white/[0.02]"
              }`}
            >
              <Icon
                className={`size-5 ${
                  isCurrent ? "text-blue-400" : isActive ? "text-emerald-400/70" : "text-white/20"
                }`}
              />
            </div>

            {/* Step labels */}
            <p
              className={`mt-1.5 text-[11px] font-semibold ${
                isCurrent ? "text-white/90" : isActive ? "text-white/60" : "text-white/30"
              }`}
            >
              {step.label}
            </p>
            <p className="text-[9px] text-[#3a5070]">{step.description}</p>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={`absolute top-5 right-auto left-[calc(50%+24px)] h-0.5 w-[calc((100%-80px)/3)] transition-colors ${
                  isActive ? "bg-emerald-500/40" : "bg-white/[0.04]"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
