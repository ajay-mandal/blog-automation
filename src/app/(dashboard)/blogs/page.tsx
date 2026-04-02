export default function BlogsPage() {
  return (
    <div className="flex flex-col">
      <div className="page-header px-6 py-5">
        <h1 className="text-gradient-blue text-xl font-semibold tracking-[-0.02em]">Blogs</h1>
        <p className="mt-0.5 text-sm text-[#8ba3cc]">All generated blog drafts</p>
      </div>
      <div className="p-6">
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-sm text-[#8ba3cc]">
            No drafts yet. Select an article from the Feed to generate one.
          </p>
        </div>
      </div>
    </div>
  )
}
