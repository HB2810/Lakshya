import React from 'react';
import { Network, ChevronDown, ChevronRight, User } from 'lucide-react';
import { CanonicalOrgNode, OrgTreeResponse } from '../../types/organization';

interface ScopedOrgTreeProps {
  treeData: OrgTreeResponse | null;
  isLoading?: boolean;
  onSelectNode?: (node: CanonicalOrgNode) => void;
}

const TreeNode: React.FC<{ 
  node: CanonicalOrgNode; 
  depth?: number;
  onSelect?: (node: CanonicalOrgNode) => void;
}> = ({ node, depth = 0, onSelect }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hasChildren = node.subordinates && node.subordinates.length > 0;
  
  // Handle backend names
  const title = node.title;
  const occupant = node.current_occupant;
  const occupantName = occupant ? occupant.full_name : null;

  return (
    <div className="space-y-1">
      <div 
        className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer hover:bg-slate-50 ${depth > 0 ? 'ml-6 border-l-2 border-slate-100 pl-4' : ''}`}
        onClick={() => onSelect?.(node)}
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={`p-1 rounded hover:bg-slate-200 transition-colors ${!hasChildren ? 'invisible' : ''}`}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-slate-500" />
          ) : (
            <ChevronRight className="w-3 h-3 text-slate-500" />
          )}
        </button>
        
        <div className="flex-1 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              {node.is_leadership ? <Network className="w-3.5 h-3.5 text-purple-600" /> : <User className="w-3.5 h-3.5 text-blue-600" />}
              {title}
            </span>
            <span className="text-[10px] text-slate-500">
              {occupantName || <span className="text-amber-600 font-semibold italic">Vacant</span>}
            </span>
          </div>
          
          <div className="flex gap-2">
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
              {node.department_name}
            </span>
          </div>
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="space-y-1">
          {node.subordinates.map((child: CanonicalOrgNode) => (
            <TreeNode key={child.position_id} node={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ScopedOrgTree: React.FC<ScopedOrgTreeProps> = ({ treeData, isLoading, onSelectNode }) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="space-y-2 pl-4 border-l-2 border-slate-100">
          <div className="h-10 bg-slate-100 rounded-xl w-3/4"></div>
          <div className="h-10 bg-slate-100 rounded-xl w-1/2 ml-6"></div>
          <div className="h-10 bg-slate-100 rounded-xl w-1/2 ml-6"></div>
        </div>
      </div>
    );
  }

  if (!treeData || !treeData.root_nodes || treeData.root_nodes.length === 0) {
    return null; // Don't show if no tree data
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Network className="w-4 h-4 text-slate-700" />
        <h3 className="text-sm font-bold text-slate-900">Your Organizational Scope</h3>
      </div>
      
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[400px]">
          {treeData.root_nodes.map((node: CanonicalOrgNode) => (
            <TreeNode key={node.position_id} node={node} onSelect={onSelectNode} />
          ))}
        </div>
      </div>
    </div>
  );
};
