import React, { useEffect, useState } from 'react';
import { getSoftwares, getServices, deleteSoftware, importCSV, uploadLogo, Software, Service, createSoftware, updateSoftware } from '../api';
import { Upload, Trash2, Edit, Plus, X } from 'lucide-react';
import { useTranslation } from '../i18n';

const AdminSoftwares = () => {
    const { t } = useTranslation();
    const [softwares, setSoftwares] = useState<Software[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [expandedChildren, setExpandedChildren] = useState<Record<string, boolean>>({});
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
        const data = { ...currentSoftware, children: currentSoftware?.children || [] };
        if (currentSoftware?.id) await updateSoftware(currentSoftware.id, data);
        else await createSoftware(data);
        setIsModalOpen(false); setCurrentSoftware(null); loadSoftwares();
    };
    const toggleChild = (id: string) => {
        const children = currentSoftware?.children || [];
        if (children.includes(id)) setCurrentSoftware({ ...currentSoftware, children: children.filter(c => c !== id) });
        else setCurrentSoftware({ ...currentSoftware, children: [...children, id] });
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{t('softwares.title')}</h2>
                <div className="flex space-x-4">
                    <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700">
                        <Upload className="mr-2 w-4 h-4" /> {t('common.import')}
                        <input type="file" className="hidden" accept=".csv" onChange={handleImport} />
                    </label>
                    <button onClick={() => { setCurrentSoftware({}); setIsModalOpen(true); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        <Plus className="mr-2 w-4 h-4" /> {t('common.add')}
                    </button>
                </div>
            </div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.logo')}</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.name')}</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('softwares.parent')}</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('softwares.children')}</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.description')}</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {softwares.map(sw => {
                            const parent = services.find(s => s.id === sw.parent_id) || softwares.find(s => s.id === sw.parent_id);
                            return (
                            <tr key={sw.id}>
                                <td className="px-6 py-4">
                                    <div className="relative w-10 h-10 border rounded overflow-hidden">
                                        {sw.logo ? <img src={`http://localhost:5000${sw.logo}`} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-center px-1 leading-tight">{t('common.noImg')}</div>}
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleLogoUpload(sw.id, e)} />
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium">{sw.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{parent?.name || '-'}</td>
                                <td className="px-6 py-4 text-sm">
                                    {sw.children && sw.children.length > 0 ? (
                                        <div>
                                            <button
                                                onClick={() => setExpandedChildren(prev => ({...prev, [sw.id]: !prev[sw.id]}))}
                                                className="text-blue-600 hover:underline flex items-center"
                                            >
                                                {sw.children.length} {t('softwares.children')}
                                            </button>
                                            {expandedChildren[sw.id] && (
                                                <ul className="mt-2 text-xs text-gray-500 list-disc list-inside bg-gray-50 p-2 rounded">
                                                    {sw.children.map(childId => {
                                                        const child = softwares.find(s => s.id === childId);
                                                        return <li key={childId}>{child?.name || 'Unknown'}</li>;
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    ) : '-'}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg w-full max-w-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">{currentSoftware?.id ? t('common.edit') : t('common.add')}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><label className="block text-sm font-medium">{t('common.name')}</label>
                            <input type="text" required className="mt-1 block w-full border rounded p-2" value={currentSoftware?.name || ''} onChange={e => setCurrentSoftware({...currentSoftware, name: e.target.value})} /></div>

                            <div className="col-span-1"><label className="block text-sm font-medium">{t('softwares.access')}</label>
                            <input type="checkbox" className="mt-1 h-5 w-5 border rounded" checked={currentSoftware?.acces || false} onChange={e => setCurrentSoftware({...currentSoftware, acces: e.target.checked})} /></div>

                            <div className="col-span-1"><label className="block text-sm font-medium">{t('softwares.parent')}</label>
                            <select className="mt-1 block w-full border rounded p-2" value={currentSoftware?.parent_id || ''} onChange={e => setCurrentSoftware({...currentSoftware, parent_id: e.target.value || null})}>
                                <option value="">{t('softwares.none')}</option>
                                <optgroup label={t('nav.services')}>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </optgroup>
                                <optgroup label={t('nav.softwares')}>
                                    {softwares.filter(sw => sw.id !== currentSoftware?.id).map(sw => <option key={sw.id} value={sw.id}>{sw.name}</option>)}
                                </optgroup>
                            </select></div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-2">{t('softwares.children')}</label>
                                <div className="border rounded p-4 h-32 overflow-y-auto bg-gray-50">
                                    {softwares.filter(sw => sw.id !== currentSoftware?.id).map(sw => (
                                        <label key={sw.id} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-white">
                                            <input type="checkbox" checked={currentSoftware?.children?.includes(sw.id) || false} onChange={() => toggleChild(sw.id)} />
                                            <span className="text-sm">{sw.name}</span>
                                        </label>
                                    ))}
                                </div>
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
