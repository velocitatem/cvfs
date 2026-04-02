'use client';

import { useState } from 'react';
import { CVTreeNode } from '@/types/cv';

interface CVTreeProps {
  treeData: CVTreeNode;
  selectedNodeId?: string;
  onNodeSelect: (nodeId: string) => void;
  onCreateBranch: (parentId: string) => void;
  onCreateSubmission: (branchId: string) => void;
}

const NODE_COLORS = {
  root: 'bg-blue-100 border-blue-300 text-blue-900',
  branch: 'bg-green-100 border-green-300 text-green-900',
  submission: 'bg-yellow-100 border-yellow-300 text-yellow-900',
};

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  interviewing: 'bg-blue-100 text-blue-700',
  offer: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-700',
};

function TreeNode({ 
  node, 
  level = 0, 
  selectedNodeId, 
  onNodeSelect, 
  onCreateBranch, 
  onCreateSubmission 
}: {
  node: CVTreeNode;
  level?: number;
  selectedNodeId?: string;
  onNodeSelect: (nodeId: string) => void;
  onCreateBranch: (parentId: string) => void;
  onCreateSubmission: (branchId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedNodeId === node.id;

  const handleNodeClick = () => {
    onNodeSelect(node.id);
  };

  const handleCreateBranch = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateBranch(node.id);
  };

  const handleCreateSubmission = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateSubmission(node.id);
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
          ${NODE_COLORS[node.type]}
          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
          hover:shadow-sm
        `}
        style={{ marginLeft: `${level * 24}px` }}
        onClick={handleNodeClick}
      >
        {hasChildren && (
          <button
            onClick={toggleExpanded}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-black/10 rounded"
          >
            <svg
              className={`w-3 h-3 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        
        {!hasChildren && <div className="w-4" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{node.label}</span>
            {node.metadata?.isPublic && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Public
              </span>
            )}
            {node.metadata?.status && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[node.metadata.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-700'}`}>
                {node.metadata.status}
              </span>
            )}
          </div>
          
          {node.metadata?.companyName && (
            <div className="text-sm text-gray-600 truncate">
              {node.metadata.companyName} • {node.metadata.roleTitle}
            </div>
          )}
          
          {node.metadata?.lastModified && (
            <div className="text-xs text-gray-500">
              Updated {new Date(node.metadata.lastModified).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-1">
          {(node.type === 'root' || node.type === 'branch') && (
            <button
              onClick={handleCreateBranch}
              className="p-1 rounded hover:bg-black/10 transition-colors"
              title="Create branch"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}
          
          {node.type === 'branch' && (
            <button
              onClick={handleCreateSubmission}
              className="p-1 rounded hover:bg-black/10 transition-colors"
              title="Create submission"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedNodeId={selectedNodeId}
              onNodeSelect={onNodeSelect}
              onCreateBranch={onCreateBranch}
              onCreateSubmission={onCreateSubmission}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CVTree({ 
  treeData, 
  selectedNodeId, 
  onNodeSelect, 
  onCreateBranch, 
  onCreateSubmission 
}: CVTreeProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">CV Versions</h2>
        <div className="text-sm text-gray-500">
          {treeData.children.reduce((acc, branch) => acc + branch.children.length + 1, 1)} versions
        </div>
      </div>
      
      <div className="space-y-3">
        <TreeNode
          node={treeData}
          selectedNodeId={selectedNodeId}
          onNodeSelect={onNodeSelect}
          onCreateBranch={onCreateBranch}
          onCreateSubmission={onCreateSubmission}
        />
      </div>
    </div>
  );
}