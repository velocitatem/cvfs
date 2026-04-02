'use client';

import { useState } from 'react';
import { PatchDiff } from '@/types/cv';

interface DiffViewerProps {
  patches: PatchDiff[];
  title?: string;
  className?: string;
}

function DiffLine({ 
  diff, 
  isExpanded, 
  onToggle 
}: { 
  diff: PatchDiff; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'added': return 'bg-green-50 border-green-200';
      case 'removed': return 'bg-red-50 border-red-200';
      case 'changed': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'added':
        return (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'removed':
        return (
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'changed':
        return (
          <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getTypeColor(diff.type)}`}>
      <div className="flex items-start gap-3">
        {getTypeIcon(diff.type)}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{diff.path}</span>
            <button
              onClick={onToggle}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              {isExpanded ? 'Hide' : 'Show'} details
            </button>
          </div>
          
          {diff.context && (
            <div className="text-xs text-gray-600 mt-1">{diff.context}</div>
          )}
          
          {isExpanded && (
            <div className="mt-3 space-y-2">
              {diff.oldValue && (
                <div className="bg-red-100 border border-red-200 rounded p-2">
                  <div className="text-xs font-medium text-red-800 mb-1">- Removed</div>
                  <div className="text-sm text-red-700">{diff.oldValue}</div>
                </div>
              )}
              
              {diff.newValue && (
                <div className="bg-green-100 border border-green-200 rounded p-2">
                  <div className="text-xs font-medium text-green-800 mb-1">+ Added</div>
                  <div className="text-sm text-green-700">{diff.newValue}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DiffViewer({ patches, title = "Changes", className = "" }: DiffViewerProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  if (patches.length === 0) {
    return (
      <div className={`card p-6 text-center ${className}`}>
        <div className="text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-medium">No changes</p>
          <p className="text-sm">This version is identical to its parent</p>
        </div>
      </div>
    );
  }

  const changeCount = patches.length;
  const addedCount = patches.filter(p => p.type === 'added').length;
  const removedCount = patches.filter(p => p.type === 'removed').length;
  const changedCount = patches.filter(p => p.type === 'changed').length;

  return (
    <div className={`card ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-4 text-sm">
            {addedCount > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                {addedCount} added
              </span>
            )}
            {changedCount > 0 && (
              <span className="flex items-center gap-1 text-yellow-600">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                {changedCount} changed
              </span>
            )}
            {removedCount > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                {removedCount} removed
              </span>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mt-1">
          {changeCount} {changeCount === 1 ? 'change' : 'changes'} detected
        </div>
      </div>
      
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {patches.map((patch, index) => (
          <DiffLine
            key={index}
            diff={patch}
            isExpanded={expandedItems.has(index)}
            onToggle={() => toggleExpanded(index)}
          />
        ))}
      </div>
    </div>
  );
}