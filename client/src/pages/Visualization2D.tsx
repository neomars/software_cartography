import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getAllData } from '../api';
import { Download, RefreshCw, Box, Type } from 'lucide-react';
import { useTranslation } from '../i18n';

const Visualization2D = () => {
    const { t } = useTranslation();
    const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [showLogos, setShowLogos] = useState(true);
    const [linkOpacity, setLinkOpacity] = useState(60);
    const [highlightNodes, setHighlightNodes] = useState(new Set());
    const [highlightLinks, setHighlightLinks] = useState(new Set());
    const fgRef = useRef<any>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAllData();
            const { softwares, services, settings } = res.data;
            if (settings && settings.linkOpacity !== undefined) setLinkOpacity(settings.linkOpacity);
            const nodes: any[] = [];
            const links: any[] = [];

            const serviceMap = new Map(services.map(s => [s.id, s]));
            const softwareMap = new Map(softwares.map(sw => [sw.id, sw]));

            const getServiceColor = (nodeId: string) => {
                let currentId: string | null = nodeId;
                const visited = new Set();
                while (currentId && !visited.has(currentId)) {
                    visited.add(currentId);
                    if (serviceMap.has(currentId)) {
                        return serviceMap.get(currentId)?.color || '#3b82f6';
                    }
                    const sw = softwareMap.get(currentId);
                    if (!sw) break;
                    // Try parent_ids first, then fallback to parent_id
                    if (sw.parent_ids && sw.parent_ids.length > 0) {
                        currentId = sw.parent_ids[0];
                    } else {
                        currentId = sw.parent_id;
                    }
                }
                return '#ffffff';
            };

            services.forEach(s => {
                const childCount = s.children.length;
                const radius = 20 + Math.min(childCount, 50);
                nodes.push({ id: s.id, name: s.name, color: s.color, isService: true, logo: s.logo, val: radius });
                s.children.forEach(childId => {
                    const isChildService = services.some(srv => srv.id === childId);
                    links.push({
                        source: s.id,
                        target: childId,
                        distance: isChildService ? radius + 100 : radius * 2,
                        isSoftwareLink: false,
                        isServiceLink: isChildService
                    });
                });
            });
            softwares.forEach(sw => {
                const color = getServiceColor(sw.id);
                nodes.push({ id: sw.id, name: sw.name, isService: false, logo: sw.logo, val: 5, color });
                if (sw.children) {
                    sw.children.forEach(childId => {
                        links.push({ source: sw.id, target: childId, distance: 30, isSoftwareLink: true });
                    });
                }
            });
            setGraphData({ nodes, links });
        } catch (error) { console.error("Error", error); }
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);
    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force('link').distance((link: any) => link.distance || 50);
            fgRef.current.d3Force('charge').strength(-200);
        }
    }, [graphData]);

    const updateHighlight = (node: any) => {
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());

        if (node) {
            const hNodes = new Set();
            const hLinks = new Set();

            const traverse = (nodeId: string, visited: Set<string>) => {
                if (visited.has(nodeId)) return;
                visited.add(nodeId);
                hNodes.add(nodeId);

                graphData.links.forEach(link => {
                    const sId = typeof link.source === 'object' ? link.source.id : link.source;
                    const tId = typeof link.target === 'object' ? link.target.id : link.target;

                    if (sId === nodeId) {
                        hLinks.add(link);
                        traverse(tId, visited);
                    } else if (tId === nodeId) {
                        hLinks.add(link);
                        traverse(sId, visited);
                    }
                });
            };

            traverse(node.id, new Set());
            setHighlightNodes(hNodes);
            setHighlightLinks(hLinks);
        }
    };

    const handleNodeClick = useCallback((node: any) => {
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(2, 1000);
        updateHighlight(node);
    }, [graphData]);

    const exportImage = () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'viz2d-export.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    const nodePaint = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const isHighlighted = highlightNodes.has(node.id);
        const anySelected = highlightNodes.size > 0;
        const dimOpacity = anySelected && !isHighlighted ? 0.15 : 1.0;

        const size = node.isService ? node.val : (isHighlighted ? 8 : 4);

        ctx.save();
        ctx.globalAlpha = dimOpacity;

        if (isHighlighted) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = node.color || '#ffffff';
        }

        // Draw node body
        ctx.beginPath();
        if (node.isService) {
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color || '#3b82f6';
            ctx.fill();
            ctx.lineWidth = isHighlighted ? 2 : 1;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
        } else {
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color || '#ffffff';
            ctx.fill();
        }

        // Draw label
        const label = node.name;
        const fontSize = (node.isService ? 16 : 12) / globalScale;
        ctx.font = `${isHighlighted ? 'bold ' : ''}${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isHighlighted ? '#ffffff' : (node.isService ? '#ffffff' : '#cccccc');

        const labelY = node.y + size + fontSize;
        ctx.fillText(label, node.x, labelY);

        ctx.restore();
    }, [highlightNodes]);

    const linkColor = useCallback((link: any) => {
        const isHighlighted = highlightLinks.has(link);
        const baseAlpha = isHighlighted ? 1.0 : (linkOpacity / 100);
        const alphaNum = Math.round(baseAlpha * (highlightNodes.size > 0 && !isHighlighted ? 0.2 : 1.0) * 255);
        const alpha = alphaNum.toString(16).padStart(2, '0');
        return isHighlighted ? `#ffffff${alpha}` : `#888888${alpha}`;
    }, [highlightLinks, highlightNodes, linkOpacity]);

    return (
        <div className="h-screen w-full relative bg-[#050505]">
            <div className="absolute top-6 left-6 z-10 flex flex-col space-y-4">
                <div className="bg-white/10 backdrop-blur-lg p-2 rounded-2xl flex flex-col space-y-2 border border-white/20 text-white">
                    <button onClick={loadData} className="p-3 hover:bg-white/10 rounded-xl transition flex items-center space-x-2"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /><span className="text-xs">{t('viz.refresh')}</span></button>
                    <button onClick={exportImage} className="p-3 hover:bg-white/10 rounded-xl transition flex items-center space-x-2"><Download className="w-5 h-5" /><span className="text-xs">{t('viz.png')}</span></button>
                </div>
            </div>
            <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                nodeCanvasObject={nodePaint}
                nodePointerAreaPaint={(node, color, ctx) => {
                    ctx.fillStyle = color;
                    const size = node.isService ? node.val : 8;
                    ctx.beginPath(); ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false); ctx.fill();
                }}
                linkWidth={(link: any) => highlightLinks.has(link) ? 4 : 1}
                linkColor={linkColor}
                linkDirectionalParticles={(link: any) => highlightLinks.has(link) ? 4 : 0}
                linkDirectionalParticleSpeed={0.01}
                linkDirectionalParticleWidth={4}
                backgroundColor="#050505"
                onNodeClick={handleNodeClick}
                onBackgroundClick={() => {
                    setHighlightNodes(new Set());
                    setHighlightLinks(new Set());
                }}
            />
        </div>
    );
};
export default Visualization2D;
