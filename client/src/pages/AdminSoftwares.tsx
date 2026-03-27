import React, { useEffect, useState, useMemo } from 'react';
import { getSoftwares, getServices, deleteSoftware, importCSV, uploadLogo, Software, Service, createSoftware, updateSoftware } from '../api';
import { Upload, Trash2, Edit, Plus, X, ArrowUpDown } from 'lucide-react';
import { useTranslation } from '../i18n';
import MultiSelect from '../components/MultiSelect';

const AdminSoftwares = () => {
    const { t } = useTranslation();
    const [softwares, setSoftwares] = useState<Software[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [expandedChildren, setExpandedChildren] = useState<Record<string, boolean>>({});
    const [sortField, setSortField] = useState<'name' | 'service'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSoftware, setCurrentSoftware] = useState<Partial<Software> | null>(null);

    useEffect(() => { loadData(); }, []);
    const loadData = async () => {
        const [resSw, resSrv] = await Promise.all([getSoftwares(), getServices()]);
        setSoftwares(resSw.data);
        setServices(resSrv.data);
    };
    const loadSoftwares = loadData;
    const handleDelete = async (id: string) => { if (window.confirm(t('common.confirmDelete'))) { await deleteSoftware(id); loadSoftwares(); } };
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { await importCSV(e.target.files[0]); loadSoftwares(); } };
    const handleLogoUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { await uploadLogo('software', id, e.target.files[0]); loadSoftwares(); } };
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { ...currentSoftware, children: currentSoftware?.children || [], parent_ids: currentSoftware?.parent_ids || [] };
        if (currentSoftware?.id) await updateSoftware(currentSoftware.id, data);
        else await createSoftware(data);
        setIsModalOpen(false); setCurrentSoftware(null); loadSoftwares();
    };

    const handleParentChange = async (swId: string, parentIds: string[]) => {
        const sw = softwares.find(s => s.id === swId);
        if (sw) {
            await updateSoftware(swId, {
                ...sw,
                parent_ids: parentIds,
                parent_id: parentIds.length > 0 ? parentIds[0] : null
            });
            loadSoftwares();
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
    }, [softwares, sortField, sortOrder, services, t]);

    const parentOptions = useMemo(() => [
        ...services.map(s => ({ id: s.id, name: s.name, group: t('nav.services') })),
        ...softwares.map(sw => ({ id: sw.id, name: sw.name, group: t('nav.softwares') }))
    ], [services, softwares, t]);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{t('softwares.title')}</h2>
                <div className="flex space-x-4">
                    <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700">
                        <Upload className="mr-2 w-4 h-4" /> {t('common.import')}
                        <input type="file" className="hidden" accept=".csv" onChange={handleImport} />
                    </label>
                    <button onClick={() => { setCurrentSoftware({ parent_ids: [], children: [] }); setIsModalOpen(true); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        <Plus className="mr-2 w-4 h-4" /> {t('common.add')}
                    </button>
                </div>
            </div>
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
                        {sortedSoftwares.map(sw => {
                            const pIds = sw.parent_ids || (sw.parent_id ? [sw.parent_id] : []);
                            return (
                            <tr key={sw.id}>
                                <td className="px-6 py-4">
                                    <div className="relative w-10 h-10 border rounded overflow-hidden">
                                        {sw.logo ? <img src={`http://localhost:5000${sw.logo}`} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-center px-1 leading-tight">{t('common.noImg')}</div>}
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleLogoUpload(sw.id, e)} />
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium">{sw.name}</td>
                                <td className="px-6 py-4 min-w-[200px]">
                                    <MultiSelect
                                        options={parentOptions.filter((o: any) => o.id !== sw.id)}
                                        selected={pIds}
                                        onChange={(ids) => handleParentChange(sw.id, ids)}
                                        placeholder={t('softwares.none')}
                                    />
                                </td>
                                <td className="px-6 py-4 min-w-[200px]">
                                    <MultiSelect
                                        options={softwares.filter(s => s.id !== sw.id).map(s => ({ id: s.id, name: s.name }))}
                                        selected={sw.children || []}
                                        onChange={(ids) => {
                                            updateSoftware(sw.id, { ...sw, children: ids }).then(loadSoftwares);
                                        }}
                                        placeholder={t('softwares.none')}
                                    />
                                </td>
                                <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{sw.description}</td>
                                <td className="px-6 py-4 flex space-x-3">
                                    <button onClick={() => { setCurrentSoftware(sw); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-900"><Edit className="w-5 h-5" /></button>
                                    <button onClick={() => handleDelete(sw.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5" /></button>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg w-full max-w-2xl p-6 my-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">{currentSoftware?.id ? t('common.edit') : t('common.add')}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><label className="block text-sm font-medium">{t('common.name')}</label>
                            <input type="text" required className="mt-1 block w-full border rounded p-2" value={currentSoftware?.name || ''} onChange={e => setCurrentSoftware({...currentSoftware, name: e.target.value})} /></div>

                            <div className="col-span-1"><label className="block text-sm font-medium">{t('softwares.access')}</label>
                            <input type="checkbox" className="mt-1 h-5 w-5 border rounded" checked={currentSoftware?.acces || false} onChange={e => setCurrentSoftware({...currentSoftware, acces: e.target.checked})} /></div>

                            <div className="col-span-2"><label className="block text-sm font-medium mb-1">{t('softwares.parent')}</label>
                                <MultiSelect
                                    options={parentOptions.filter((o: any) => o.id !== currentSoftware?.id)}
                                    selected={currentSoftware?.parent_ids || (currentSoftware?.parent_id ? [currentSoftware.parent_id] : [])}
                                    onChange={(ids) => setCurrentSoftware({...currentSoftware, parent_ids: ids, parent_id: ids.length > 0 ? ids[0] : null})}
                                    placeholder={t('softwares.none')}
                                />
                            </div>

                            <div className="col-span-2"><label className="block text-sm font-medium mb-1">{t('softwares.children')}</label>
                                <MultiSelect
                                    options={softwares.filter(sw => sw.id !== currentSoftware?.id).map(sw => ({ id: sw.id, name: sw.name }))}
                                    selected={currentSoftware?.children || []}
                                    onChange={(ids) => setCurrentSoftware({...currentSoftware, children: ids})}
                                    placeholder={t('softwares.none')}
                                />
                            </div>

                            <div className="col-span-2"><label className="block text-sm font-medium">{t('common.description')}</label>
                            <textarea className="mt-1 block w-full border rounded p-2" value={currentSoftware?.description || ''} onChange={e => setCurrentSoftware({...currentSoftware, description: e.target.value})} /></div>
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
