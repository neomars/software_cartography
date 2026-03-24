import React, { useEffect, useState, useRef, useCallback } from 'react';
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
                while (currentId) {
                    if (serviceMap.has(currentId)) {
                        return serviceMap.get(currentId)?.color || '#3b82f6';
                    }
                    const sw = softwareMap.get(currentId);
                    currentId = sw ? sw.parent_id : null;
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
            // Increase link strength globally to keep nodes tight
            fgRef.current.d3Force('link').strength(2);
            // Set link distances as defined in the data
            fgRef.current.d3Force('link').distance((link: any) => link.distance || 30);
            // Drastically reduce charge strength to avoid nodes pushing each other outside spheres
            fgRef.current.d3Force('charge').strength(-30);
            // Adjust center force
            fgRef.current.d3Force('center').strength(0.05);
            // Add many-body force to keep nodes within the same service closer
            fgRef.current.d3Force('charge').distanceMax(150);
        }
    }, [graphData]);

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
        if (node.isService) {
            const group = new THREE.Group();
            const radius = node.radius || 45;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (context) {
                canvas.width = 512; canvas.height = 128;
                context.font = 'Bold 60px Arial'; context.fillStyle = node.color || '#3b82f6'; context.textAlign = 'center';
                context.fillText(node.name, 256, 80);
                const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }));
                sprite.scale.set(radius * 1.5, radius * 0.4, 1);
                // Position above elements
                sprite.position.y = radius * 0.8;
                group.add(sprite);
            }

            return group;
        } else {
            if (showLogos && node.logo) {
                const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.TextureLoader().load(`http://localhost:5000${node.logo}`) }));
                sprite.scale.set(15, 15, 1); return sprite;
            } else {
                const group = new THREE.Group();
                group.add(new THREE.Mesh(new THREE.SphereGeometry(5), new THREE.MeshLambertMaterial({ color: node.color || '#ffffff' })));
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (context) {
                    canvas.width = 256; canvas.height = 64;
                    context.font = '30px Arial'; context.fillStyle = 'white'; context.textAlign = 'center';
                    context.fillText(node.name, 128, 48);
                    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }));
                    sprite.scale.set(20, 5, 1); sprite.position.y = 8; group.add(sprite);
                }
                return group;
            }
        }
    }, [showLogos]);

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
                linkWidth={(link: any) => link.isSoftwareLink || link.isServiceLink ? 3 : 1}
                linkColor={(link: any) => {
                    const alpha = Math.round((linkOpacity / 100) * 255).toString(16).padStart(2, '0');
                    return link.isSoftwareLink || link.isServiceLink ? `#ffffff${alpha}` : `#ffffff${Math.round((linkOpacity / 100) * 0.3 * 255).toString(16).padStart(2, '0')}`;
                }}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                backgroundColor="#050505"
                nodeLabel="name"
                onNodeClick={(node: any) => { fgRef.current.cameraPosition({ x: node.x * 1.5, y: node.y * 1.5, z: node.z * 1.5 }, node, 1000); }}
                rendererConfig={{ preserveDrawingBuffer: true }}
            />
        </div>
    );
};
export default Visualization;
