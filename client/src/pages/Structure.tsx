import React, { useEffect, useState, useCallback } from 'react';
import { getServices, getSoftwares, updateService, updateSoftware, Service, Software } from '../api';
import { useTranslation } from '../i18n';
import { ChevronRight, ChevronDown, Folder, FileText, Move, Network, Search } from 'lucide-react';

interface TreeNode {
    id: string;
    name: string;
    isService: boolean;
    color: string | null;
    children: TreeNode[];
    parent_id: string | null;
}

const Structure = () => {
    const { t } = useTranslation();
    const [tree, setTree] = useState<TreeNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const buildTree = useCallback((services: Service[], softwares: Software[]) => {
        const allNodes: TreeNode[] = [
            ...services.map(s => ({ id: s.id, name: s.name, isService: true, color: s.color, children: [], parent_id: s.parent_id })),
            ...softwares.map(sw => ({ id: sw.id, name: sw.name, isService: false, color: null, children: [], parent_id: sw.parent_id }))
        ];

        const serviceMap = new Map(services.map(s => [s.id, s]));
        const softwareMap = new Map(softwares.map(sw => [sw.id, sw]));

        const getEffectiveColor = (nodeId: string): string => {
            let currentId: string | null = nodeId;
            let visited = new Set();
            while (currentId && !visited.has(currentId)) {
                visited.add(currentId);
                if (serviceMap.has(currentId)) return serviceMap.get(currentId)!.color;
                const sw = softwareMap.get(currentId);
                currentId = sw ? sw.parent_id : null;
            }
            return '#ccc';
        };

        allNodes.forEach(node => {
            if (!node.isService) node.color = getEffectiveColor(node.id);
        });

        const nodesById = new Map(allNodes.map(n => [n.id, n]));

        allNodes.forEach(node => {
            if (node.parent_id && nodesById.has(node.parent_id) && node.parent_id !== node.id) {
                nodesById.get(node.parent_id)!.children.push(node);
            }
        });

        const rootNodes: TreeNode[] = [];
        const reached = new Set();

        const markReached = (node: TreeNode) => {
            if (reached.has(node.id)) return;
            reached.add(node.id);
            node.children.forEach(markReached);
        };

        // First pass: real roots
        allNodes.forEach(node => {
            if (!node.parent_id || !nodesById.has(node.parent_id) || node.parent_id === node.id) {
                rootNodes.push(node);
                markReached(node);
            }
        });

        // Second pass: find islands/cycles and promote them to root to ensure visibility
        allNodes.forEach(node => {
            if (!reached.has(node.id)) {
                rootNodes.push(node);
                markReached(node);
            }
        });

        const sortNodes = (nodes: TreeNode[]) => {
            nodes.sort((a, b) => a.name.localeCompare(b.name));
            nodes.forEach(n => sortNodes(n.children));
        };
        sortNodes(rootNodes);
        return rootNodes;
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [resSrv, resSw] = await Promise.all([getServices(), getSoftwares()]);
            setTree(buildTree(resSrv.data, resSw.data));
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [buildTree]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(targetId);
    };

    const handleDrop = async (e: React.DragEvent, targetId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverId(null);
        const id = e.dataTransfer.getData('text/plain');
        if (id === targetId) return;

        // Prevent dropping onto itself or its own children
        const findNode = (nodes: TreeNode[], nodeId: string): TreeNode | null => {
            for (const n of nodes) {
                if (n.id === nodeId) return n;
                const found = findNode(n.children, nodeId);
                if (found) return found;
            }
            return null;
        };
        const draggedNode = findNode(tree, id);
        if (draggedNode && targetId) {
            const isChild = (parent: TreeNode, childId: string): boolean => {
                return parent.children.some(c => c.id === childId || isChild(c, childId));
            };
            if (isChild(draggedNode, targetId)) return;
        }

        try {
            if (draggedNode?.isService) {
                await updateService(id, { parent_id: targetId });
            } else {
                await updateSoftware(id, { parent_id: targetId });
            }
            loadData();
        } catch (error) { console.error(error); }
        setDraggedId(null);
    };

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const matchesSearch = useCallback((node: TreeNode): boolean => {
        if (node.name.toLowerCase().includes(searchTerm.toLowerCase())) return true;
        return node.children.some(child => matchesSearch(child));
    }, [searchTerm]);

    const renderNode = (node: TreeNode, level: number) => {
        if (searchTerm && !matchesSearch(node)) return null;

        const isExpanded = expanded[node.id] || (searchTerm && node.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const hasChildren = node.children.length > 0;
        const isOver = dragOverId === node.id;

        return (
            <div key={node.id} className="select-none">
                <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, node.id)}
                    onDragOver={(e) => handleDragOver(e, node.id)}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={(e) => handleDrop(e, node.id)}
                    className={`flex items-center p-2 rounded-lg transition group hover:bg-gray-100 ${draggedId === node.id ? 'opacity-50' : ''} ${isOver ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''}`}
                    style={{ paddingLeft: `${level * 20 + 8}px` }}
                >
                    <button
                        onClick={() => toggleExpand(node.id)}
                        className={`p-1 rounded hover:bg-gray-200 transition ${!hasChildren ? 'invisible' : ''}`}
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div className="flex items-center flex-1 ml-1">
                        {node.isService ? (
                            <Folder className="w-4 h-4 mr-2 text-blue-500 fill-blue-500/20" />
                        ) : (
                            <FileText className="w-4 h-4 mr-2 text-gray-400" />
                        )}

                        <span className={`text-sm ${node.isService ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                            {node.name}
                        </span>

                        <div
                            className="ml-3 w-3 h-3 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: node.color || '#ccc' }}
                            title={node.isService ? 'Service Color' : 'Belongs to service'}
                        />

                        <Move className="w-4 h-4 ml-auto text-gray-300 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                </div>
                {isExpanded && node.children.map(child => renderNode(child, level + 1))}
            </div>
        );
    };

    if (loading) return <div className="p-8">Loading structure...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-800">{t('nav.structure')}</h1>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div
                className={`bg-white rounded-2xl shadow-sm border p-6 min-h-[500px] transition ${dragOverId === 'root' ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100'}`}
                onDragOver={(e) => handleDragOver(e, 'root')}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => handleDrop(e, null)}
            >
                <div className="mb-4 text-xs text-gray-400 uppercase font-bold tracking-wider">
                    {t('nav.structure')} (Unified Tree)
                </div>

                <div className="space-y-1">
                    {tree.map(node => renderNode(node, 0))}
                </div>

                {tree.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Network className="w-12 h-12 mb-2 opacity-20" />
                        <p>No elements found.</p>
                    </div>
                )}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm text-blue-700">
                    💡 <strong>Tip:</strong> Drag and drop any service or software to change its parent. Drop an item in the empty area at the bottom to make it a root element.
                </p>
            </div>
        </div>
    );
};

export default Structure;
