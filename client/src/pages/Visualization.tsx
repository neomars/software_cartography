import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { getAllData } from '../api';
import { Download, RefreshCw, Box, Type, AlertTriangle, Play, Pause, XCircle, FileSpreadsheet } from 'lucide-react';
import * as TablerIcons from '@tabler/icons-react';
import { useTranslation } from '../i18n';

const Visualization = () => {
    const { t } = useTranslation();
    const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [showLogos, setShowLogos] = useState(true);
    const [linkOpacity, setLinkOpacity] = useState(60);
    const [hoverNode, setHoverNode] = useState<any>(null);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [highlightNodes, setHighlightNodes] = useState(new Set());
    const [highlightLinks, setHighlightLinks] = useState(new Set());
    const [isSimulationMode, setIsSimulationMode] = useState(false);
    const [failedNodeIds, setFailedNodeIds] = useState<Set<string>>(new Set());
    const [impactedNodeIds, setImpactedNodeIds] = useState<Set<string>>(new Set());
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
                const radius = 40 + Math.min(childCount, 100) * 2;
                nodes.push({ id: s.id, name: s.name, color: s.color, isService: true, logo: s.logo, icon: s.icon, val: 60, radius });
                s.children.forEach(childId => {
                    const isChildService = services.some(srv => srv.id === childId);
                    links.push({
                        source: s.id,
                        target: childId,
                        distance: isChildService ? radius + 50 : radius * 0.25,
                        isSoftwareLink: false,
                        isServiceLink: isChildService
                    });
                });
            });
            softwares.forEach(sw => {
                const color = getServiceColor(sw.id);
                nodes.push({ id: sw.id, name: sw.name, isService: false, logo: sw.logo, icon: sw.icon, val: 8, color });
                if (sw.children) {
                    sw.children.forEach(childId => {
                        links.push({ source: sw.id, target: childId, distance: 10, isSoftwareLink: true });
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
            fgRef.current.d3Force('link').strength(1);
            fgRef.current.d3Force('link').distance((link: any) => link.distance || 50);
            fgRef.current.d3Force('charge').strength(-100);
            fgRef.current.d3Force('center').strength(0.05);
            fgRef.current.d3Force('charge').distanceMax(500);
        }
    }, [graphData]);

    const computeImpact = useCallback((failedIds: Set<string>) => {
        const impacted = new Set<string>();
        if (failedIds.size === 0) return impacted;

        const queue = Array.from(failedIds);
        const visited = new Set<string>(failedIds);

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            graphData.links.forEach(link => {
                const sId = typeof link.source === 'object' ? link.source.id : link.source;
                const tId = typeof link.target === 'object' ? link.target.id : link.target;

                if (sId === currentId && !visited.has(tId)) {
                    visited.add(tId);
                    impacted.add(tId);
                    queue.push(tId);
                }
            });
        }
        return impacted;
    }, [graphData.links]);

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
        if (isSimulationMode) {
            const newFailed = new Set(failedNodeIds);
            if (newFailed.has(node.id)) {
                newFailed.delete(node.id);
            } else {
                newFailed.add(node.id);
            }
            setFailedNodeIds(newFailed);
            setImpactedNodeIds(computeImpact(newFailed));
        } else {
            // Aim at node from outside it
            const distance = 150;
            const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

            fgRef.current.cameraPosition(
                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new pos
                node, // lookAt ({ x, y, z })
                1500  // ms transition duration
            );

            setSelectedNode(node);
            updateHighlight(node);
        }
    }, [graphData, fgRef, isSimulationMode, failedNodeIds, computeImpact]);

    const exportImage = () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            const suffix = isSimulationMode ? '-simulation' : '';
            link.download = `viz3d-export${suffix}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    const exportCSV = () => {
        if (!isSimulationMode) return;

        const failed = graphData.nodes.filter(n => failedNodeIds.has(n.id)).map(n => ({ ...n, status: 'FAILED' }));
        const impacted = graphData.nodes.filter(n => impactedNodeIds.has(n.id)).map(n => ({ ...n, status: 'IMPACTED' }));

        const all = [...failed, ...impacted];
        const csvRows = [
            ['ID', 'Name', 'Type', 'Status'],
            ...all.map(n => [n.id, n.name, n.isService ? 'Service' : 'Software', n.status])
        ];

        const csvContent = csvRows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "impact-analysis.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const nodeObject = useCallback((node: any) => {
        const isHighlighted = highlightNodes.has(node.id);
        const isFailed = failedNodeIds.has(node.id);
        const isImpacted = impactedNodeIds.has(node.id);

        const anySelection = highlightNodes.size > 0 || failedNodeIds.size > 0;
        const dimOpacity = anySelection && !isHighlighted && !isFailed && !isImpacted ? 0.15 : 1.0;

        const group = new THREE.Group();

        if (node.isService) {
            const radius = node.radius || 45;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (context) {
                const fontSize = 60;
                context.font = `Bold ${fontSize}px Arial`;
                const textWidth = context.measureText(node.name).width;
                canvas.width = textWidth + 40;
                canvas.height = fontSize + 20;

                context.font = `Bold ${fontSize}px Arial`;
                if (isFailed) context.fillStyle = '#ef4444';
                else if (isImpacted) context.fillStyle = '#f97316';
                else context.fillStyle = isHighlighted ? '#ffffff' : (node.color || '#3b82f6');

                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(node.name, canvas.width / 2, canvas.height / 2);

                const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                    map: new THREE.CanvasTexture(canvas),
                    transparent: true,
                    opacity: dimOpacity
                }));
                const aspectRatio = canvas.width / canvas.height;
                const height = radius * (isHighlighted || isFailed ? 0.8 : 0.6);
                sprite.scale.set(height * aspectRatio, height, 1);
                sprite.position.y = -radius * 1.2; // Position below
                group.add(sprite);
            }

            // Glow effect for service
            if (isHighlighted || isFailed || isImpacted) {
                const glowGeometry = new THREE.SphereGeometry(radius * (isFailed ? 0.6 : 0.5));
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: isFailed ? '#ef4444' : (isImpacted ? '#f97316' : (node.color || '#3b82f6')),
                    transparent: true,
                    opacity: 0.5 * dimOpacity
                });
                group.add(new THREE.Mesh(glowGeometry, glowMaterial));
            }

            return group;
        } else {
            if (showLogos && node.logo && !isFailed && !isImpacted) {
                const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                    map: new THREE.TextureLoader().load(`http://localhost:5000${node.logo}`),
                    transparent: true,
                    opacity: dimOpacity
                }));
                const scale = isHighlighted ? 25 : 15;
                sprite.scale.set(scale, scale, 1);
                return sprite;
            } else {
                const nodeSize = isHighlighted || isFailed ? 8 : 5;
                const geometry = new THREE.SphereGeometry(nodeSize);
                const color = isFailed ? '#ef4444' : (isImpacted ? '#f97316' : (node.color || '#ffffff'));
                const material = new THREE.MeshLambertMaterial({
                    color: color,
                    emissive: (isHighlighted || isFailed || isImpacted) ? color : '#000000',
                    emissiveIntensity: (isHighlighted || isFailed || isImpacted) ? 0.5 : 0,
                    transparent: true,
                    opacity: dimOpacity
                });
                group.add(new THREE.Mesh(geometry, material));

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (context) {
                    const fontSize = isHighlighted || isFailed ? 80 : 60;
                    context.font = (isHighlighted || isFailed) ? `Bold ${fontSize}px Arial` : `${fontSize}px Arial`;
                    const textWidth = context.measureText(node.name).width;
                    canvas.width = textWidth + 40;
                    canvas.height = fontSize + 20;

                    context.font = (isHighlighted || isFailed) ? `Bold ${fontSize}px Arial` : `${fontSize}px Arial`;
                    if (isFailed) context.fillStyle = '#ef4444';
                    else if (isImpacted) context.fillStyle = '#f97316';
                    else context.fillStyle = isHighlighted ? (node.color || '#ffffff') : 'white';

                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText(node.name, canvas.width / 2, canvas.height / 2);

                    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                        map: new THREE.CanvasTexture(canvas),
                        transparent: true,
                        opacity: dimOpacity,
                        depthTest: false
                    }));
                    const aspectRatio = canvas.width / canvas.height;
                    const height = isHighlighted || isFailed ? 12 : 9;
                    sprite.scale.set(height * aspectRatio, height, 1);
                    sprite.position.y = isHighlighted || isFailed ? -15 : -10; // Position below
                    sprite.renderOrder = 999;
                    group.add(sprite);
                }
                return group;
            }
        }
    }, [showLogos, highlightNodes, failedNodeIds, impactedNodeIds]);

    const linkColor = useCallback((link: any) => {
        const sId = typeof link.source === 'object' ? link.source.id : link.source;
        const isHighlighted = highlightLinks.has(link);
        const isFailedLink = failedNodeIds.has(sId) || impactedNodeIds.has(sId);

        const baseAlpha = isHighlighted || isFailedLink ? 1.0 : (linkOpacity / 100);
        const anySelection = highlightNodes.size > 0 || failedNodeIds.size > 0;
        const dimFactor = anySelection && !isHighlighted && !isFailedLink ? 0.2 : 1.0;

        const alphaNum = Math.round(baseAlpha * dimFactor * 255);
        const alpha = alphaNum.toString(16).padStart(2, '0');

        if (isFailedLink) return `#ef4444${alpha}`;
        return isHighlighted ? `#ffffff${alpha}` : `#ffffff${alpha}`;
    }, [highlightLinks, highlightNodes, failedNodeIds, impactedNodeIds, linkOpacity]);

    const impactedList = useMemo(() => {
        return graphData.nodes.filter(n => impactedNodeIds.has(n.id));
    }, [graphData.nodes, impactedNodeIds]);

    return (
        <div className="h-screen w-full relative bg-[#050505]">
            <div className="absolute top-6 left-6 z-10 flex flex-col space-y-4">
                <div className="bg-white/10 backdrop-blur-lg p-2 rounded-2xl flex flex-col space-y-2 border border-white/20 text-white">
                    <button onClick={loadData} className="p-3 hover:bg-white/10 rounded-xl transition flex items-center space-x-2"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /><span className="text-xs">{t('viz.refresh')}</span></button>
                    <div className="flex flex-row space-x-1">
                        <button onClick={exportImage} className="flex-1 p-3 hover:bg-white/10 rounded-xl transition flex items-center justify-center space-x-2" title={t('viz.png')}><Download className="w-5 h-5" /><span className="text-[10px]">{t('viz.png')}</span></button>
                        {isSimulationMode && (
                            <button onClick={exportCSV} className="flex-1 p-3 hover:bg-white/10 rounded-xl transition flex items-center justify-center space-x-2 text-green-400" title={t('viz.csv')}><FileSpreadsheet className="w-5 h-5" /><span className="text-[10px]">{t('viz.csv')}</span></button>
                        )}
                    </div>
                    <button onClick={() => setShowLogos(!showLogos)} className="p-3 hover:bg-white/10 rounded-xl transition flex items-center space-x-2">{showLogos ? <Type className="w-5 h-5" /> : <Box className="w-5 h-5" />}<span className="text-xs">{showLogos ? t('viz.names') : t('viz.logos')}</span></button>
                    <button
                        onClick={() => {
                            setIsSimulationMode(!isSimulationMode);
                            if (!isSimulationMode) {
                                setSelectedNode(null);
                                setHighlightNodes(new Set());
                                setHighlightLinks(new Set());
                            } else {
                                setFailedNodeIds(new Set());
                                setImpactedNodeIds(new Set());
                            }
                        }}
                        className={`p-3 rounded-xl transition flex items-center space-x-2 ${isSimulationMode ? 'bg-red-500/50 hover:bg-red-500/70 text-white' : 'hover:bg-white/10'}`}
                    >
                        {isSimulationMode ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        <span className="text-xs">{isSimulationMode ? t('viz.stopSim') : t('viz.startSim')}</span>
                    </button>
                </div>

                {isSimulationMode && impactedList.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-lg p-4 rounded-2xl border border-white/20 text-white w-64 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center space-x-2 mb-3 text-orange-400">
                            <AlertTriangle className="w-5 h-5" />
                            <h3 className="font-bold text-sm">{t('viz.impacted')} ({impactedList.length})</h3>
                        </div>
                        <ul className="space-y-1">
                            {impactedList.map(node => (
                                <li key={node.id} className="text-xs py-1 px-2 hover:bg-white/5 rounded flex items-center justify-between">
                                    <span>{node.name}</span>
                                    <span className={`w-2 h-2 rounded-full ${node.isService ? 'bg-blue-400' : 'bg-white/50'}`}></span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {isSimulationMode && failedNodeIds.size > 0 && (
                     <button
                        onClick={() => {
                            setFailedNodeIds(new Set());
                            setImpactedNodeIds(new Set());
                        }}
                        className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center justify-center space-x-2 border border-white/20"
                     >
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs">{t('viz.reset')}</span>
                     </button>
                )}
            </div>
            <ForceGraph3D
                ref={fgRef}
                graphData={graphData}
                nodeThreeObject={nodeObject}
                linkWidth={(link: any) => {
                    const isHighlighted = highlightLinks.has(link);
                    const baseWidth = link.isSoftwareLink || link.isServiceLink ? 3 : 1;
                    return isHighlighted ? baseWidth * 2 : baseWidth;
                }}
                linkColor={linkColor}
                linkDirectionalParticles={(link: any) => highlightLinks.has(link) ? 4 : 0}
                linkDirectionalParticleSpeed={0.01}
                linkDirectionalParticleWidth={4}
                backgroundColor="#050505"
                nodeLabel="name"
                onNodeClick={handleNodeClick}
                onBackgroundClick={() => {
                    setSelectedNode(null);
                    setHighlightNodes(new Set());
                    setHighlightLinks(new Set());
                }}
                rendererConfig={{ preserveDrawingBuffer: true }}
            />
        </div>
    );
};
export default Visualization;
