import type { Document, Version, StructuredBlock } from "@/libs/api"

type Props = {
  documents: Document[]
}

const gradientPalette = ["from-amber-200/60", "from-sky-200/50", "from-rose-200/50", "from-emerald-200/50"]

export function DocumentTree({ documents }: Props) {
  if (!documents.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/40 to-slate-800/60 p-10 text-white/80">
        <p className="text-lg font-semibold">No resumes ingested yet</p>
        <p className="mt-3 text-sm text-white/60">
          Upload your ATS-safe DOCX to create the canonical root. Each specialization will appear here as a branch with its own patch history.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {documents.map((doc, docIndex) => (
        <div
          key={doc.id}
          className={`rounded-3xl border border-white/10 bg-gradient-to-br ${gradientPalette[docIndex % gradientPalette.length]} to-slate-900/50 p-6 text-white`}
        >
          <div className="flex flex-col gap-1 border-b border-white/15 pb-4">
            <span className="text-sm uppercase tracking-[0.2em] text-white/60">Root CV</span>
            <h3 className="text-2xl font-semibold">{doc.title}</h3>
            {doc.description ? (
              <p className="text-white/70">{doc.description}</p>
            ) : null}
          </div>
          <div className="mt-4 space-y-4">
            {doc.versions.map((version) => (
              <div key={version.id}>
                <BranchCard version={version} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function BranchCard({ version }: { version: Version }) {
  const patches = version.patches ?? []
  const structured = version.structured_blocks ?? []
  const blockPreview = structured.slice(0, 2)
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-white/60">{version.branch_name}</p>
          <p className="text-lg font-semibold">{version.version_label ?? "untitled"}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
          {patches.length} patches
        </span>
      </div>
      {blockPreview.length ? (
        <div className="mt-4 space-y-3">
          {blockPreview.map((block) => (
            <KeywordChip key={block.path} block={block} />
          ))}
        </div>
      ) : null}
      {patches.length ? (
        <ul className="mt-4 divide-y divide-white/5">
          {patches.slice(-3).map((patch) => (
            <li key={patch.id} className="py-2 text-sm text-white/80">
              <span className="font-mono text-white/60">{patch.target_path}</span>
              <span className="ml-2 text-white">→ {patch.operation}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-white/60">No tailoring applied yet.</p>
      )}
    </div>
  )
}

function KeywordChip({ block }: { block: StructuredBlock }) {
  const keywords = block.keywords.slice(0, 3)
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-wide text-white/60">{block.path}</p>
      <p className="text-sm text-white/90">{block.text}</p>
      {keywords.length ? (
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
          {keywords.map((keyword) => (
            <span key={keyword} className="rounded-full bg-white/10 px-2 py-0.5">
              {keyword}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
