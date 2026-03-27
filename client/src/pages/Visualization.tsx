import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { getAllData } from '../api';
import { Download, RefreshCw, Box, Type } from 'lucide-react';
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
                nodes.push({ id: s.id, name: s.name, color: s.color, isService: true, logo: s.logo, val: 60, radius });
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
                nodes.push({ id: sw.id, name: sw.name, isService: false, logo: sw.logo, val: 8, color });
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
    }, [graphData, fgRef]);

    const exportImage = () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'viz3d-export.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    const nodeObject = useCallback((node: any) => {
        const isHighlighted = highlightNodes.has(node.id);
        const anySelected = highlightNodes.size > 0;
        const group = new THREE.Group();
        const dimOpacity = anySelected && !isHighlighted ? 0.15 : 1.0;

        if (node.isService) {
            const radius = node.radius || 45;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (context) {
                canvas.width = 512; canvas.height = 128;
                context.font = 'Bold 60px Arial';
                context.fillStyle = isHighlighted ? '#ffffff' : (node.color || '#3b82f6');
                context.textAlign = 'center';
                context.fillText(node.name, 256, 80);

                const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                    map: new THREE.CanvasTexture(canvas),
                    transparent: true,
                    opacity: dimOpacity
                }));
                sprite.scale.set(radius * (isHighlighted ? 2 : 1.5), radius * (isHighlighted ? 0.6 : 0.4), 1);
                sprite.position.y = radius * 0.8;
                group.add(sprite);
            }

            // Glow effect for service
            if (isHighlighted) {
                const glowGeometry = new THREE.SphereGeometry(radius * 0.5);
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: node.color || '#3b82f6',
                    transparent: true,
                    opacity: 0.3 * dimOpacity
                });
                group.add(new THREE.Mesh(glowGeometry, glowMaterial));
            }

            return group;
        } else {
            if (showLogos && node.logo) {
                const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                    map: new THREE.TextureLoader().load(`http://localhost:5000${node.logo}`),
                    transparent: true,
                    opacity: dimOpacity
                }));
                const scale = isHighlighted ? 25 : 15;
                sprite.scale.set(scale, scale, 1);
                return sprite;
            } else {
                const geometry = new THREE.SphereGeometry(isHighlighted ? 8 : 5);
                const material = new THREE.MeshLambertMaterial({
                    color: node.color || '#ffffff',
                    emissive: isHighlighted ? (node.color || '#ffffff') : '#000000',
                    emissiveIntensity: isHighlighted ? 0.5 : 0,
                    transparent: true,
                    opacity: dimOpacity
                });
                group.add(new THREE.Mesh(geometry, material));

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (context) {
                    canvas.width = 256; canvas.height = 64;
                    context.font = isHighlighted ? 'Bold 40px Arial' : '30px Arial';
                    context.fillStyle = isHighlighted ? (node.color || '#ffffff') : 'white';
                    context.textAlign = 'center';
                    context.fillText(node.name, 128, 48);
                    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                        map: new THREE.CanvasTexture(canvas),
                        transparent: true,
                        opacity: dimOpacity
                    }));
                    sprite.scale.set(isHighlighted ? 30 : 20, isHighlighted ? 7.5 : 5, 1);
                    sprite.position.y = isHighlighted ? 12 : 8;
                    group.add(sprite);
                }
                return group;
            }
        }
    }, [showLogos, highlightNodes]);

    const linkColor = useCallback((link: any) => {
        const isHighlighted = highlightLinks.has(link);
        const baseAlpha = isHighlighted ? 1.0 : (linkOpacity / 100);
        const alpha = Math.round(baseAlpha * 255).toString(16).padStart(2, '0');

        if (isHighlighted) {
            // Bright white for highlighted links
            return `#ffffff${alpha}`;
        }

        // Dim color if a node is selected but this link is not highlighted
        const dimFactor = highlightNodes.size > 0 ? 0.2 : 1.0;
        const dimAlphaNum = Math.round(baseAlpha * dimFactor * 255);
        const dimAlpha = dimAlphaNum.toString(16).padStart(2, '0');
        return `#ffffff${dimAlpha}`;
    }, [highlightLinks, highlightNodes, linkOpacity]);

    return (
        <div className="h-screen w-full relative bg-[#050505]">
            <div className="absolute top-6 left-6 z-10 flex flex-col space-y-4">
                <div className="bg-white/10 backdrop-blur-lg p-2 rounded-2xl flex flex-col space-y-2 border border-white/20 text-white">
                    <button onClick={loadData} className="p-3 hover:bg-white/10 rounded-xl transition flex items-center space-x-2"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /><span className="text-xs">{t('viz.refresh')}</span></button>
                    <button onClick={exportImage} className="p-3 hover:bg-white/10 rounded-xl transition flex items-center space-x-2"><Download className="w-5 h-5" /><span className="text-xs">{t('viz.png')}</span></button>
                    <button onClick={() => setShowLogos(!showLogos)} className="p-3 hover:bg-white/10 rounded-xl transition flex items-center space-x-2">{showLogos ? <Type className="w-5 h-5" /> : <Box className="w-5 h-5" />}<span className="text-xs">{showLogos ? t('viz.names') : t('viz.logos')}</span></button>
                </div>
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
