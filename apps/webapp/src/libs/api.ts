const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:9812";

export type StructuredBlock = {
  path: string
  block_type: string
  text: string
  keywords: string[]
}

export type Patch = {
  id: string
  target_path: string
  operation: string
  rationale?: string | null
  new_value?: string | null
  created_at: string
}

export type Version = {
  id: string
  branch_name: string
  version_label?: string | null
  parent_version_id?: string | null
  structured_blocks?: StructuredBlock[] | null
  patches?: Patch[]
}

export type Document = {
  id: string
  title: string
  description?: string | null
  owner_id: string
  versions: Version[]
}

export async function fetchDocuments(): Promise<Document[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents`, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  })
  if (!response.ok) {
    throw new Error("Unable to load documents")
  }
  const payload = await response.json()
  return payload?.items ?? []
}

export { API_BASE_URL }
