"use client"

import { useRouter } from "next/navigation"
import { useState, ChangeEvent, FormEvent } from "react"

import { API_BASE_URL } from "@/libs/api"

export function UploadResumeCard() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0]
    if (nextFile) {
      setFile(nextFile)
      setTitle((prev: string) => (prev ? prev : nextFile.name.replace(/\.docx$/i, "")))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file || !title) {
      setError("Title and DOCX are both required")
      return
    }
    setStatus("uploading")
    setError(null)
    const formData = new FormData()
    formData.append("title", title)
    if (description) {
      formData.append("description", description)
    }
    formData.append("file", file)
    const response = await fetch(`${API_BASE_URL}/api/v1/documents`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) {
      setStatus("error")
      setError("Upload failed. Ensure the FastAPI backend is reachable.")
      return
    }
    setStatus("success")
    setFile(null)
    setDescription("")
    router.refresh()
    setTimeout(() => setStatus("idle"), 2500)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-white shadow-2xl"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Canonical CV</p>
          <h2 className="mt-2 text-2xl font-semibold">Upload ATS-safe DOCX</h2>
        </div>
        {status === "uploading" ? (
          <div className="rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
            Uploading…
          </div>
        ) : null}
      </div>
      <div className="mt-6 space-y-4">
        <label className="block text-sm text-white/70">
          Title
          <input
            value={title}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)}
            placeholder="Resume Branch name"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/40"
            required
          />
        </label>
        <label className="block text-sm text-white/70">
          Description
          <textarea
            value={description}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)}
            placeholder="Optional context for this CV"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-white/40"
            rows={3}
          />
        </label>
        <label className="block text-sm text-white/70">
          DOCX File
          <input
            type="file"
            accept=".docx"
            className="mt-2 w-full rounded-2xl border border-dashed border-white/25 bg-black/10 px-4 py-4 text-sm text-white/70"
            onChange={onFileChange}
            required
          />
        </label>
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {status === "success" ? (
        <p className="mt-4 text-sm text-emerald-300">Ingestion queued. Blocks appear in the tree within seconds.</p>
      ) : null}
      <button
        type="submit"
        className="mt-6 w-full rounded-2xl bg-white/90 px-4 py-3 text-center text-slate-900 transition hover:bg-white"
        disabled={status === "uploading"}
      >
        Ingest Canonical CV
      </button>
    </form>
  )
}
