"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  url: z.string().url("Must be a valid URL"),
  siteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category: z.string().max(50).optional(),
})

type FormValues = z.infer<typeof schema>

export function AddSourceDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (res.status === 409) {
      toast.error("A source with this URL already exists")
      return
    }
    if (!res.ok) {
      toast.error("Failed to add source")
      return
    }

    toast.success("Source added")
    reset()
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <Plus className="size-3.5" />
            Add Source
          </Button>
        }
      />
      <DialogContent className="glass-strong border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white/90">Add Source</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="text-xs text-[#8ba3cc]">
              Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. The Verge"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-blue-500/50"
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="url" className="text-xs text-[#8ba3cc]">
              Blog / Feed URL <span className="text-red-400">*</span>
            </Label>
            <Input
              id="url"
              placeholder="https://example.com/blog  or  https://example.com/feed.xml"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-blue-500/50"
              {...register("url")}
            />
            {errors.url && <p className="text-xs text-red-400">{errors.url.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="siteUrl" className="text-xs text-[#8ba3cc]">
              Site URL <span className="text-white/30">(optional)</span>
            </Label>
            <Input
              id="siteUrl"
              placeholder="https://example.com"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-blue-500/50"
              {...register("siteUrl")}
            />
            {errors.siteUrl && <p className="text-xs text-red-400">{errors.siteUrl.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category" className="text-xs text-[#8ba3cc]">
              Category <span className="text-white/30">(optional)</span>
            </Label>
            <Input
              id="category"
              placeholder="e.g. Tech, AI, Design"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-blue-500/50"
              {...register("category")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-[#8ba3cc] hover:text-white"
              onClick={() => {
                reset()
                setOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              Add Source
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
