import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getSoftwares, getServices, deleteSoftware, importCSV, uploadLogo, Software, Service, createSoftware, updateSoftware } from '../api';
import { Upload, Trash2, Edit, Plus, X, ArrowUpDown, LayoutGrid, Network, GitGraph } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import { useRef } from 'react';
import { useTranslation } from '../i18n';
import MultiSelect from '../components/MultiSelect';

interface SelectOption {
    id: string;
    name: string;
    group?: string;
}

const AdminSoftwares: React.FC = () => {
    const { t } = useTranslation();
    const [softwares, setSoftwares] = useState<Software[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [sortField, setSortField] = useState<'name' | 'service'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [currentSoftware, setCurrentSoftware] = useState<Partial<Software> | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'graph' | 'tree'>('grid');
    const fgRef = useRef<any>(null);

    const loadData = useCallback(async () => {
        try {
            const [resSw, resSrv] = await Promise.all([getSoftwares(), getServices()]);
            setSoftwares(resSw.data);
            setServices(resSrv.data);
        } catch (error) {
            console.error("Failed to load data", error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSoftware) return;

        const data: Partial<Software> = {
            ...currentSoftware,
            children: currentSoftware.children || [],
            parent_ids: currentSoftware.parent_ids || []
        };

        try {
            if (currentSoftware.id) {
                await updateSoftware(currentSoftware.id, data);
            } else {
                await createSoftware(data);
            }
            setIsModalOpen(false);
            setCurrentSoftware(null);
            loadData();
        } catch (error) {
            console.error("Failed to save software", error);
        }
    };

    const handleParentChange = async (swId: string, parentIds: string[]) => {
        const sw = softwares.find(s => s.id === swId);
        if (sw) {
            try {
                await updateSoftware(swId, {
                    ...sw,
                    parent_ids: parentIds,
                    parent_id: parentIds.length > 0 ? parentIds[0] : null
                });
                loadData();
            } catch (error) {
                console.error("Failed to update parent", error);
            }
        }
    };

    const handleSort = (field: 'name' | 'service') => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // Define parentOptions inside the component and wrap in useMemo
    const parentOptions = useMemo<SelectOption[]>(() => [
        ...services.map((s: Service) => ({ id: s.id, name: s.name, group: t('nav.services') })),
        ...softwares.map((sw: Software) => ({ id: sw.id, name: sw.name, group: t('nav.softwares') }))
    ], [services, softwares, t]);

    const sortedSoftwares = useMemo(() => {
        return [...softwares].sort((a, b) => {
            let valA = '';
            let valB = '';

            if (sortField === 'name') {
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
            } else {
                const getFirstParentName = (sw: Software) => {
                    const pIds = sw.parent_ids || (sw.parent_id ? [sw.parent_id] : []);
                    if (pIds.length === 0) return '';
                    const p = services.find(s => s.id === pIds[0]) || softwares.find(s => s.id === pIds[0]);
                    return p?.name || '';
                };
                valA = getFirstParentName(a).toLowerCase();
                valB = getFirstParentName(b).toLowerCase();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [softwares, sortField, sortOrder, services]);

    const graphData = useMemo(() => {
        const nodes = [
            ...services.map(s => ({ id: s.id, name: s.name, color: s.color, isService: true })),
            ...softwares.map(sw => ({ id: sw.id, name: sw.name, color: services.find(s => s.id === (sw.parent_ids?.[0] || sw.parent_id))?.color || '#94a3b8', isService: false }))
        ];
        const links: any[] = [];
        softwares.forEach(sw => {
            const pIds = sw.parent_ids || (sw.parent_id ? [sw.parent_id] : []);
            pIds.forEach(pid => {
                links.push({ source: pid, target: sw.id });
            });
            (sw.children || []).forEach(cid => {
                links.push({ source: sw.id, target: cid });
            });
        });
        return { nodes, links };
    }, [services, softwares]);

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-6">
                    <h2 className="text-2xl font-bold">{t('softwares.title')}</h2>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LayoutGrid className="w-4 h-4 mr-2" />
                            {t('softwares.viewGrid')}
                        </button>
                        <button
                            onClick={() => setViewMode('graph')}
                            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'graph' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Network className="w-4 h-4 mr-2" />
                            {t('softwares.viewGraph')}
                        </button>
                        <button
                            onClick={() => setViewMode('tree')}
                            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'tree' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <GitGraph className="w-4 h-4 mr-2" />
                            {t('softwares.viewTree')}
                        </button>
                    </div>
                </div>
                <div className="flex space-x-4">
                    <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700">
                        <Upload className="mr-2 w-4 h-4" /> {t('common.import')}
                        <input
                            type="file"
                            className="hidden"
                            accept=".csv"
                            onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                    await importCSV(e.target.files[0]);
                                    loadData();
                                }
                            }}
                        />
                    </label>
                    <button
                        onClick={() => { setCurrentSoftware({ parent_ids: [], children: [] }); setIsModalOpen(true); }}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        <Plus className="mr-2 w-4 h-4" /> {t('common.add')}
                    </button>
                </div>
            </div>
            {viewMode === 'graph' || viewMode === 'tree' ? (
                <div className="flex-1 bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden relative min-h-[600px]">
                    <ForceGraph2D
                        ref={fgRef}
                        graphData={graphData}
                        dagMode={viewMode === 'tree' ? 'td' : undefined}
                        dagLevelDistance={100}
                        nodeLabel="name"
                        nodeColor={(n: any) => n.color}
                        nodeCanvasObject={(node: any, ctx, globalScale) => {
                            const label = node.name;
                            const fontSize = 12/globalScale;
                            ctx.font = `${fontSize}px Sans-Serif`;
                            const textWidth = ctx.measureText(label).width;
                            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                            ctx.fillStyle = node.color;
                            ctx.beginPath();
                            if (node.isService) {
                                ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
                            } else {
                                ctx.rect(node.x - 4, node.y - 4, 8, 8);
                            }
                            ctx.fill();

                            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + 10 - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = '#333';
                            ctx.fillText(label, node.x, node.y + 10);
                        }}
                        linkDirectionalParticles={2}
                        linkDirectionalParticleSpeed={0.005}
                        onNodeClick={(node: any) => {
                            const sw = softwares.find(s => s.id === node.id);
                            if (sw) {
                                setCurrentSoftware(sw);
                                setIsModalOpen(true);
                            }
                        }}
                    />
                </div>
            ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.logo')}</th>
                            <th
                                className="px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center">
                                    {t('common.name')}
                                    <ArrowUpDown className="ml-1 w-3 h-3" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('service')}
                            >
                                <div className="flex items-center">
                                    {t('softwares.parent')}
                                    <ArrowUpDown className="ml-1 w-3 h-3" />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('softwares.children')}</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.description')}</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedSoftwares.map((sw: Software) => {
                            const pIds = sw.parent_ids || (sw.parent_id ? [sw.parent_id] : []);
                            return (
                                <tr key={sw.id}>
                                    <td className="px-6 py-4">
                                        <div className="relative w-10 h-10 border rounded overflow-hidden">
                                            {sw.logo ? (
                                                <img src={`http://localhost:5000${sw.logo}`} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-center px-1 leading-tight">{t('common.noImg')}</div>
                                            )}
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={async (e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        await uploadLogo('software', sw.id, e.target.files[0]);
                                                        loadData();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        <div className="flex items-center">
                                            {sw.name}
                                            {sw.criticality && (
                                                <span className={`ml-2 w-3 h-3 rounded-full ${
                                                    sw.criticality === 1 ? 'bg-red-500' :
                                                    sw.criticality === 2 ? 'bg-orange-500' : 'bg-green-500'
                                                }`} title={t(`common.tier${sw.criticality}`)} />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 min-w-[200px]">
                                        <MultiSelect
                                            options={parentOptions.filter((o: SelectOption) => o.id !== sw.id)}
                                            selected={pIds}
                                            onChange={(ids) => handleParentChange(sw.id, ids)}
                                            placeholder={t('softwares.none')}
                                        />
                                    </td>
                                    <td className="px-6 py-4 min-w-[200px]">
                                        <MultiSelect
                                            options={softwares.filter((s: Software) => s.id !== sw.id).map((s: Software) => ({ id: s.id, name: s.name }))}
                                            selected={sw.children || []}
                                            onChange={async (ids) => {
                                                await updateSoftware(sw.id, { ...sw, children: ids });
                                                loadData();
                                            }}
                                            placeholder={t('softwares.none')}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{sw.description}</td>
                                    <td className="px-6 py-4 flex space-x-3">
                                        <button
                                            onClick={() => { setCurrentSoftware(sw); setIsModalOpen(true); }}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm(t('common.confirmDelete'))) {
                                                    await deleteSoftware(sw.id);
                                                    loadData();
                                                }
                                            }}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            )}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg w-full max-w-2xl p-6 my-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">{currentSoftware?.id ? t('common.edit') : t('common.add')}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium">{t('common.name')}</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border rounded p-2"
                                    value={currentSoftware?.name || ''}
                                    onChange={e => setCurrentSoftware(prev => ({ ...prev!, name: e.target.value }))}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">{t('common.criticality')}</label>
                                <div className="flex space-x-4 mt-1">
                                    {[1, 2, 3].map((tier) => (
                                        <button
                                            key={tier}
                                            type="button"
                                            onClick={() => setCurrentSoftware(prev => ({ ...prev!, criticality: tier }))}
                                            className={`flex-1 py-2 px-3 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                currentSoftware?.criticality === tier
                                                    ? tier === 1 ? 'border-red-500 bg-red-50 text-red-700' :
                                                      tier === 2 ? 'border-orange-500 bg-orange-50 text-orange-700' :
                                                      'border-green-500 bg-green-50 text-green-700'
                                                    : 'border-gray-100 bg-white text-gray-400 grayscale'
                                            }`}
                                        >
                                            <span className={`w-3 h-3 rounded-full mr-2 ${
                                                tier === 1 ? 'bg-red-500' : tier === 2 ? 'bg-orange-500' : 'bg-green-500'
                                            }`} />
                                            {t(`common.tier${tier}`)}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setCurrentSoftware(prev => ({ ...prev!, criticality: undefined }))}
                                        className={`py-2 px-3 rounded-lg border-2 text-xs ${!currentSoftware?.criticality ? 'border-gray-400 bg-gray-50 text-gray-700' : 'border-gray-100 text-gray-400'}`}
                                    >
                                        {t('common.none')}
                                    </button>
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium">{t('softwares.access')}</label>
                                <input
                                    type="checkbox"
                                    className="mt-1 h-5 w-5 border rounded"
                                    checked={currentSoftware?.acces || false}
                                    onChange={e => setCurrentSoftware(prev => ({ ...prev!, acces: e.target.checked }))}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">{t('softwares.parent')}</label>
                                <MultiSelect
                                    options={parentOptions.filter((o: SelectOption) => o.id !== currentSoftware?.id)}
                                    selected={currentSoftware?.parent_ids || (currentSoftware?.parent_id ? [currentSoftware.parent_id] : [])}
                                    onChange={(ids) => setCurrentSoftware(prev => ({ ...prev!, parent_ids: ids, parent_id: ids.length > 0 ? ids[0] : null }))}
                                    placeholder={t('softwares.none')}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">{t('softwares.children')}</label>
                                <MultiSelect
                                    options={softwares.filter((sw: Software) => sw.id !== currentSoftware?.id).map((sw: Software) => ({ id: sw.id, name: sw.name }))}
                                    selected={currentSoftware?.children || []}
                                    onChange={(ids) => setCurrentSoftware(prev => ({ ...prev!, children: ids }))}
                                    placeholder={t('softwares.none')}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium">{t('common.description')}</label>
                                <textarea
                                    className="mt-1 block w-full border rounded p-2"
                                    value={currentSoftware?.description || ''}
                                    onChange={e => setCurrentSoftware(prev => ({ ...prev!, description: e.target.value }))}
                                />
                            </div>
                            <div className="col-span-2 flex justify-end mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-4 px-4 py-2 border rounded">{t('common.cancel')}</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{t('common.save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSoftwares;
