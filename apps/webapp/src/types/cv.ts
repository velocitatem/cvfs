// Core data types for Resume Branches system

export interface CVDocument {
  id: string;
  ownerId: string;
  title: string;
  rootVersionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CVVersion {
  id: string;
  documentId: string;
  parentVersionId?: string;
  branchName?: string;
  versionLabel: string;
  artifactDocxKey: string;
  previewHtmlKey?: string;
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
}

export interface CVPatch {
  id: string;
  versionId: string;
  patchType: 'text_replace' | 'reorder' | 'add' | 'remove';
  targetPath: string; // e.g., "experience[1].bullets[2]" or "summary.paragraph_1"
  operation: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

export interface Specialization {
  id: string;
  documentId: string;
  name: string;
  basedOnVersionId: string;
  description?: string;
  color?: string; // For UI visualization
}

export interface Submission {
  id: string;
  versionId: string;
  companyName: string;
  roleTitle: string;
  jobUrl?: string;
  jobDescription?: string;
  status: 'draft' | 'submitted' | 'rejected' | 'interviewing' | 'offer' | 'closed';
  publicAssetId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicAsset {
  id: string;
  submissionId?: string;
  versionId?: string;
  slug: string;
  artifactKey: string;
  isPublic: boolean;
  expiresAt?: string;
  viewCount: number;
  url?: string | null;
  paperlessShareUrl?: string | null;
}

export interface AISuggestion {
  id: string;
  submissionId: string;
  targetPath: string;
  suggestionType: 'strengthen_verb' | 'add_keyword' | 'reorder' | 'shorten' | 'expand';
  proposedText: string;
  rationale: string;
  accepted?: boolean;
  appliedAt?: string;
}

// UI-specific types
export interface CVTreeNode {
  id: string;
  label: string;
  type: 'root' | 'branch' | 'submission';
  versionId: string;
  parentId?: string;
  children: CVTreeNode[];
  metadata?: {
    companyName?: string;
    roleTitle?: string;
    status?: string;
    isPublic?: boolean;
    lastModified?: string;
  };
}

export interface PatchDiff {
  path: string;
  type: 'added' | 'removed' | 'changed';
  oldValue?: string;
  newValue?: string;
  context?: string;
}

export interface CVStructure {
  header: {
    name: string;
    title: string;
    contact: string[];
  };
  summary?: {
    paragraphs: string[];
  };
  experience: Array<{
    company: string;
    title: string;
    duration: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    duration: string;
    details?: string[];
  }>;
  skills: {
    [category: string]: string[];
  };
  sections?: Array<{
    title: string;
    content: string[] | Record<string, unknown>;
  }>;
}