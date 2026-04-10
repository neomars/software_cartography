import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { getSoftwares, getServices, deleteSoftware, uploadLogo, Software, Service, createSoftware, updateSoftware } from '../api';
import { Trash2, Edit, Plus, X, LayoutGrid, Network, GitGraph } from 'lucide-react';
import * as TablerIcons from '@tabler/icons-react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTranslation } from '../i18n';
import MultiSelect from '../components/MultiSelect';
import IconPicker from '../components/IconPicker';

interface SelectOption {
    id: string;
    name: string;
    group?: string;
}

const AdminSoftwares: React.FC = () => {
    const { t } = useTranslation();
    const [softwares, setSoftwares] = useState<Software[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [currentSoftware, setCurrentSoftware] = useState<Partial<Software> | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'graph' | 'tree'>('grid');
    const [uploadingSoftwareId, setUploadingSoftwareId] = useState<string | null>(null);

    const fgRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleDelete = async (id: string) => {
        if (window.confirm(t('common.confirmDelete'))) {
            try {
                await deleteSoftware(id);
                loadData();
            } catch (error) {
                console.error("Failed to delete software", error);
            }
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (uploadingSoftwareId && e.target.files && e.target.files[0]) {
            try {
                await uploadLogo('software', uploadingSoftwareId, e.target.files[0]);
                loadData();
            } catch (error) {
                console.error("Logo upload failed", error);
            } finally {
                setUploadingSoftwareId(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const triggerUpload = (id: string) => {
        setUploadingSoftwareId(id);
        fileInputRef.current?.click();
    };

    const parentOptions = useMemo<SelectOption[]>(() => [
        ...services.map((s: Service) => ({ id: s.id, name: s.name, group: t('nav.services') })),
        ...softwares.map((sw: Software) => ({ id: sw.id, name: sw.name, group: t('nav.softwares') }))
    ], [services, softwares, t]);

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
            {/* Global Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none', position: 'fixed', top: -100, left: -100 }}
                onChange={handleLogoUpload}
                accept="image/*"
            />

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
                <button
                    onClick={() => { setCurrentSoftware({ parent_ids: [], children: [] }); setIsModalOpen(true); }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-lg transition-transform active:scale-95"
                >
                    <Plus className="mr-2 w-4 h-4" /> {t('common.add')}
                </button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {softwares.map(sw => {
                        const pIds = sw.parent_ids || (sw.parent_id ? [sw.parent_id] : []);
                        const firstParentId = pIds[0];
                        const parentColor = services.find(s => s.id === firstParentId)?.color || '#94a3b8';

                        const parentNames = pIds
                            .map(pid => services.find(s => s.id === pid)?.name || softwares.find(s => s.id === pid)?.name)
                            .filter(Boolean)
                            .join(', ');

                        return (
                            <div key={sw.id} className="bg-white p-6 rounded-lg shadow-md border-t-4" style={{ borderTopColor: parentColor }}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center overflow-hidden">
                                        <div
                                            className="relative w-12 h-12 border rounded overflow-hidden mr-3 flex-shrink-0 cursor-pointer hover:border-blue-400 transition-colors"
                                            onClick={() => triggerUpload(sw.id)}
                                            title={t('common.logo')}
                                        >
                                            {sw.logo ? (
                                                <img src={`http://localhost:5000${sw.logo}`} alt="" className="w-full h-full object-cover" />
                                            ) : sw.icon && (TablerIcons as any)[sw.icon] ? (
                                                <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                    {React.createElement((TablerIcons as any)[sw.icon], { className: "w-6 h-6" })}
                                                </div>
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-center px-1">{t('common.logo')}</div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold truncate" title={sw.name}>{sw.name}</h3>
                                            <p className="text-xs text-gray-500 truncate">
                                                {sw.children?.length ? t('services.numComponents', { count: sw.children.length }) : t('softwares.none')}
                                            </p>
                                            {parentNames && <p className="text-xs text-blue-600 mt-1 truncate">Parents: {parentNames}</p>}
                                            {sw.criticality && (
                                                <div className="mt-2 flex items-center">
                                                    <span className={`w-3 h-3 rounded-full mr-2 ${
                                                        sw.criticality === 1 ? 'bg-red-500' :
                                                        sw.criticality === 2 ? 'bg-orange-500' : 'bg-green-500'
                                                    }`} />
                                                    <span className="text-xs font-medium text-gray-600">
                                                        {t(`common.tier${sw.criticality}`)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 ml-2">
                                        <button
                                            onClick={() => { setCurrentSoftware(sw); setIsModalOpen(true); }}
                                            className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full transition-colors"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(sw.id)}
                                            className="text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                {sw.description && (
                                    <p className="mt-4 text-sm text-gray-500 line-clamp-2" title={sw.description}>
                                        {sw.description}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl w-full max-w-2xl p-6 my-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-xl font-bold">{currentSoftware?.id ? t('common.edit') : t('common.add')}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-gray-100 p-2 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('common.name')}</label>
                                <input
                                    type="text"
                                    required
                                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 bg-gray-50 border"
                                    value={currentSoftware?.name || ''}
                                    onChange={e => setCurrentSoftware(prev => ({ ...prev!, name: e.target.value }))}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('common.criticality')}</label>
                                <div className="flex space-x-3">
                                    {[1, 2, 3].map((tier) => (
                                        <button
                                            key={tier}
                                            type="button"
                                            onClick={() => setCurrentSoftware(prev => ({ ...prev!, criticality: tier }))}
                                            className={`flex-1 py-2 px-3 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                currentSoftware?.criticality === tier
                                                    ? tier === 1 ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' :
                                                      tier === 2 ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' :
                                                      'border-green-500 bg-green-50 text-green-700 shadow-sm'
                                                    : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 grayscale opacity-70'
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
                                        className={`py-2 px-3 rounded-lg border-2 text-xs transition-colors ${!currentSoftware?.criticality ? 'border-gray-400 bg-gray-50 text-gray-700 font-bold' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        {t('common.none')}
                                    </button>
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('softwares.parent')}</label>
                                <MultiSelect
                                    options={parentOptions.filter((o: SelectOption) => o.id !== currentSoftware?.id)}
                                    selected={currentSoftware?.parent_ids || (currentSoftware?.parent_id ? [currentSoftware.parent_id] : [])}
                                    onChange={(ids) => setCurrentSoftware(prev => ({ ...prev!, parent_ids: ids, parent_id: ids.length > 0 ? ids[0] : null }))}
                                    placeholder={t('softwares.none')}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('softwares.children')}</label>
                                <MultiSelect
                                    options={softwares.filter((sw: Software) => sw.id !== currentSoftware?.id).map((sw: Software) => ({ id: sw.id, name: sw.name }))}
                                    selected={currentSoftware?.children || []}
                                    onChange={(ids) => setCurrentSoftware(prev => ({ ...prev!, children: ids }))}
                                    placeholder={t('softwares.none')}
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('common.icon')}</label>
                                <IconPicker
                                    selectedIcon={currentSoftware?.icon}
                                    onSelect={(iconName) => setCurrentSoftware(prev => ({ ...prev!, icon: iconName }))}
                                />
                            </div>

                            <div className="col-span-1 flex items-center mt-6">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={currentSoftware?.acces || false}
                                        onChange={e => setCurrentSoftware(prev => ({ ...prev!, acces: e.target.checked }))}
                                    />
                                    <span className="text-sm font-semibold text-gray-700">{t('softwares.access')}</span>
                                </label>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('common.description')}</label>
                                <textarea
                                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 bg-gray-50 border h-24"
                                    value={currentSoftware?.description || ''}
                                    onChange={e => setCurrentSoftware(prev => ({ ...prev!, description: e.target.value }))}
                                />
                            </div>

                            <div className="col-span-2 flex justify-end space-x-3 mt-6 border-t pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition-all active:scale-95"
                                >
                                    {t('common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSoftwares;
