import React, { useState, useMemo } from 'react';
import { Network, ChevronDown, ChevronRight, User, Search, Users, ChevronsUpDown, ShieldCheck, Briefcase } from 'lucide-react';
import { CanonicalOrgNode, OrgTreeResponse } from '../../types/organization';

interface ScopedOrgTreeProps {
  treeData: OrgTreeResponse | null;
  isLoading?: boolean;
  onSelectNode?: (node: CanonicalOrgNode) => void;
  title?: string;
  subtitle?: string;
}

interface TreeNodeProps {
  node: CanonicalOrgNode;
  depth?: number;
  searchTerm: string;
  forceExpand?: boolean | null;
  onSelect?: (node: CanonicalOrgNode) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth = 0, searchTerm, forceExpand, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  React.useEffect(() => {
    if (forceExpand !== null && forceExpand !== undefined) {
      setIsExpanded(forceExpand);
    }
  }, [forceExpand]);

  const hasChildren = node.subordinates && node.subordinates.length > 0;
  const title = node.title;
  const occupant = node.current_occupant;
  const occupantName = occupant ? occupant.full_name : null;

  // Filter check
  const matchesSearch = useMemo(() => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const titleMatch = title.toLowerCase().includes(term);
    const occupantMatch = occupantName?.toLowerCase().includes(term) || false;
    const deptMatch = node.department_name.toLowerCase().includes(term);
    const codeMatch = node.code?.toLowerCase().includes(term) || false;
    return titleMatch || occupantMatch || deptMatch || codeMatch;
  }, [searchTerm, title, occupantName, node.department_name, node.code]);

  // Check if any child matches search
  const anyChildMatches = useMemo(() => {
    if (!searchTerm.trim()) return true;
    const checkSub = (children: CanonicalOrgNode[]): boolean => {
      return children.some(c => {
        const tMatch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
        const oMatch = c.current_occupant?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const dMatch = c.department_name.toLowerCase().includes(searchTerm.toLowerCase());
        if (tMatch || oMatch || dMatch) return true;
        return c.subordinates ? checkSub(c.subordinates) : false;
      });
    };
    return hasChildren ? checkSub(node.subordinates) : false;
  }, [searchTerm, hasChildren, node.subordinates]);

  if (searchTerm.trim() && !matchesSearch && !anyChildMatches) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div 
        className={`flex items-center gap-2 p-2.5 rounded-xl transition-all cursor-pointer border ${
          matchesSearch && searchTerm.trim() 
            ? 'bg-blue-50/80 border-blue-200 shadow-2xs' 
            : 'bg-white hover:bg-slate-50/80 border-slate-200/70 hover:border-slate-300'
        } ${depth > 0 ? 'ml-6 border-l-4 border-l-blue-400 pl-3.5' : ''}`}
        onClick={() => onSelect?.(node)}
      >
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={`p-1 rounded-md hover:bg-slate-200/80 text-slate-500 transition-colors ${!hasChildren ? 'invisible' : ''}`}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          )}
        </button>
        
        <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              node.is_leadership ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {node.is_leadership ? <Network className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-900 truncate">{title}</span>
                {node.code && (
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                    {node.code}
                  </span>
                )}
                {node.is_leadership && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded uppercase">
                    Leadership
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                  {occupant ? (
                    <span className="text-slate-800 font-semibold">{occupant.full_name}</span>
                  ) : (
                    <span className="text-amber-600 font-semibold italic flex items-center gap-0.5">
                      • Vacant Position
                    </span>
                  )}
                </span>
                {hasChildren && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({node.subordinates.length} direct report{node.subordinates.length > 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200/60 rounded-lg">
              {node.department_name}
            </span>
          </div>
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="space-y-1.5 pt-0.5">
          {node.subordinates.map((child: CanonicalOrgNode) => (
            <TreeNode 
              key={child.position_id} 
              node={child} 
              depth={depth + 1} 
              searchTerm={searchTerm}
              forceExpand={forceExpand}
              onSelect={onSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ScopedOrgTree: React.FC<ScopedOrgTreeProps> = ({ 
  treeData, 
  isLoading, 
  onSelectNode,
  title = 'Hospital Organization Chart',
  subtitle = 'Stavya Spine Hospital reporting hierarchy, leadership structure, and position assignments'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [forceExpand, setForceExpand] = useState<boolean | null>(null);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!treeData?.root_nodes) return { total: 0, occupied: 0, vacant: 0 };
    let total = 0;
    let occupied = 0;
    let vacant = 0;

    const traverse = (nodes: CanonicalOrgNode[]) => {
      nodes.forEach(n => {
        total++;
        if (n.current_occupant) occupied++;
        else vacant++;
        if (n.subordinates) traverse(n.subordinates);
      });
    };

    traverse(treeData.root_nodes);
    return { total, occupied, vacant };
  }, [treeData]);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-5 bg-slate-200 rounded w-1/3"></div>
        <div className="h-4 bg-slate-100 rounded w-1/2"></div>
        <div className="space-y-3 pl-4 border-l-2 border-slate-100 pt-2">
          <div className="h-12 bg-slate-100 rounded-2xl w-full"></div>
          <div className="h-12 bg-slate-100 rounded-2xl w-5/6 ml-6"></div>
          <div className="h-12 bg-slate-100 rounded-2xl w-4/6 ml-12"></div>
        </div>
      </div>
    );
  }

  if (!treeData || !treeData.root_nodes || treeData.root_nodes.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xs space-y-2">
        <Network className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-900">No Organizational Hierarchy Available</h3>
        <p className="text-xs text-slate-500">The organizational structure tree has not been populated yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
      {/* Header with Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Network className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-xl">
            {stats.total} Total Positions
          </span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
            {stats.occupied} Occupied
          </span>
          {stats.vacant > 0 && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
              {stats.vacant} Vacant
            </span>
          )}
        </div>
      </div>

      {/* Search & Tree Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search position, occupant, department..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setForceExpand(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={() => setForceExpand(false)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>
      
      {/* Tree Visualization */}
      <div className="overflow-x-auto pb-2 pt-1">
        <div className="min-w-[500px] space-y-2">
          {treeData.root_nodes.map((node: CanonicalOrgNode) => (
            <TreeNode 
              key={node.position_id} 
              node={node} 
              searchTerm={searchTerm}
              forceExpand={forceExpand}
              onSelect={onSelectNode} 
            />
          ))}
        </div>
      </div>
      
      <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 flex items-center justify-between">
        <span>💡 Click any position card to view details or initiate an employee transfer.</span>
        <span className="font-semibold text-slate-500">{treeData.organization_name}</span>
      </div>
    </div>
  );
};

