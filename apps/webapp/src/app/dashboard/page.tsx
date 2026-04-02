'use client';

import { useState } from 'react';
import CVTree from '@/components/cv/CVTree';
import DiffViewer from '@/components/cv/DiffViewer';
import { CVTreeNode, PatchDiff } from '@/types/cv';

// Mock data for demonstration
const mockTreeData: CVTreeNode = {
  id: 'root-1',
  label: 'Master Resume',
  type: 'root',
  versionId: 'v-root-1',
  children: [
    {
      id: 'branch-ml',
      label: 'ML Engineer',
      type: 'branch',
      versionId: 'v-ml-1',
      parentId: 'root-1',
      metadata: {
        lastModified: '2024-01-15T10:30:00Z',
      },
      children: [
        {
          id: 'sub-anthropic',
          label: 'Anthropic Applied AI',
          type: 'submission',
          versionId: 'v-sub-anthropic-1',
          parentId: 'branch-ml',
          metadata: {
            companyName: 'Anthropic',
            roleTitle: 'Applied AI Research Engineer',
            status: 'interviewing',
            lastModified: '2024-01-20T14:20:00Z',
          },
          children: [],
        },
        {
          id: 'sub-openai',
          label: 'OpenAI Research',
          type: 'submission',
          versionId: 'v-sub-openai-1',
          parentId: 'branch-ml',
          metadata: {
            companyName: 'OpenAI',
            roleTitle: 'Research Engineer',
            status: 'submitted',
            isPublic: true,
            lastModified: '2024-01-18T09:15:00Z',
          },
          children: [],
        },
      ],
    },
    {
      id: 'branch-backend',
      label: 'Backend Engineer',
      type: 'branch',
      versionId: 'v-backend-1',
      parentId: 'root-1',
      metadata: {
        lastModified: '2024-01-12T16:45:00Z',
      },
      children: [
        {
          id: 'sub-stripe',
          label: 'Stripe Infrastructure',
          type: 'submission',
          versionId: 'v-sub-stripe-1',
          parentId: 'branch-backend',
          metadata: {
            companyName: 'Stripe',
            roleTitle: 'Senior Backend Engineer',
            status: 'draft',
            lastModified: '2024-01-22T11:30:00Z',
          },
          children: [],
        },
      ],
    },
  ],
};

const mockPatches: PatchDiff[] = [
  {
    path: 'summary.paragraph_1',
    type: 'changed',
    oldValue: 'Machine learning engineer with 3+ years building production systems',
    newValue: 'Applied AI research engineer with 3+ years building production ML systems for large-scale applications',
    context: 'Summary section',
  },
  {
    path: 'experience[0].bullets[1]',
    type: 'changed',
    oldValue: 'Built recommendation system serving 10M+ users',
    newValue: 'Built and scaled recommendation system using deep learning, serving 10M+ users with 40% improvement in engagement',
    context: 'Senior ML Engineer at TechCorp',
  },
  {
    path: 'skills.technical',
    type: 'added',
    newValue: 'Constitutional AI, RLHF, Transformer architectures',
    context: 'Technical skills section',
  },
];

export default function Dashboard() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('root-1');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleCreateBranch = (parentId: string) => {
    // TODO: Implement branch creation
    console.log('Creating branch from:', parentId);
  };

  const handleCreateSubmission = (branchId: string) => {
    // TODO: Implement submission creation  
    console.log('Creating submission from:', branchId);
  };

  const selectedNode = findNodeById(mockTreeData, selectedNodeId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resume Branches</h1>
            <p className="text-gray-600">Manage your CV versions like code</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-secondary"
            >
              Upload New CV
            </button>
            <button className="btn-primary">
              Export Selected
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - CV Tree */}
        <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
          <CVTree
            treeData={mockTreeData}
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
            onCreateBranch={handleCreateBranch}
            onCreateSubmission={handleCreateSubmission}
          />
        </div>

        {/* Center Panel - Version Details */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl">
            {selectedNode && (
              <div className="space-y-6">
                {/* Version Header */}
                <div className="card p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedNode.label}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Version {selectedNode.versionId}</span>
                        {selectedNode.metadata?.lastModified && (
                          <span>
                            Updated {new Date(selectedNode.metadata.lastModified).toLocaleDateString()}
                          </span>
                        )}
                        {selectedNode.metadata?.status && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${{
                            draft: 'bg-gray-100 text-gray-700',
                            submitted: 'bg-yellow-100 text-yellow-700',
                            interviewing: 'bg-blue-100 text-blue-700',
                            offer: 'bg-green-100 text-green-700',
                            rejected: 'bg-red-100 text-red-700',
                            closed: 'bg-gray-100 text-gray-700',
                          }[selectedNode.metadata.status] || 'bg-gray-100 text-gray-700'}`}>
                            {selectedNode.metadata.status}
                          </span>
                        )}
                      </div>
                      {selectedNode.metadata?.companyName && (
                        <div className="mt-3">
                          <p className="text-lg font-medium text-gray-900">
                            {selectedNode.metadata.companyName}
                          </p>
                          <p className="text-gray-600">{selectedNode.metadata.roleTitle}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {selectedNode.metadata?.isPublic && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                          </svg>
                          Public
                        </span>
                      )}
                      <button className="btn-ghost">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button className="btn-primary">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download DOCX
                  </button>
                  
                  <button className="btn-secondary">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Version
                  </button>
                  
                  {!selectedNode.metadata?.isPublic && (
                    <button className="btn-ghost">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Publish
                    </button>
                  )}
                </div>

                {/* Diff Viewer */}
                {selectedNode.type !== 'root' && (
                  <DiffViewer 
                    patches={mockPatches}
                    title={`Changes from ${selectedNode.parentId === 'root-1' ? 'Master Resume' : 'Parent Branch'}`}
                  />
                )}

                {/* Preview Section */}
                <div className="card">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
                  </div>
                  <div className="p-6">
                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-600 mb-2">Document preview will appear here</p>
                      <p className="text-sm text-gray-500">Upload a CV to get started</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upload New CV</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 mb-2">Drag and drop your DOCX file here</p>
              <p className="text-sm text-gray-500">or click to browse</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                className="btn-secondary flex-1"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              <button className="btn-primary flex-1">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function findNodeById(node: CVTreeNode, id: string): CVTreeNode | null {
  if (node.id === id) return node;
  
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  
  return null;
}
