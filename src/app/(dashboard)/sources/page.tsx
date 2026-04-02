export default function SourcesPage() {
  return (
    <div className="flex flex-col">
      <div className="page-header px-6 py-5">
        <h1 className="text-gradient-blue text-xl font-semibold tracking-[-0.02em]">Sources</h1>
        <p className="mt-0.5 text-sm text-[#8ba3cc]">Manage your RSS feed sources</p>
      </div>
      <div className="p-6">
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-sm text-[#8ba3cc]">No sources added yet.</p>
        </div>
      </div>
    </div>
  )
}
