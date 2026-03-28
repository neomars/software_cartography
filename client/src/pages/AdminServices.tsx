import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getServices, getSoftwares, deleteService, createService, updateService, Software, Service, uploadLogo } from '../api';
import { Trash2, Edit, Plus, X } from 'lucide-react';
import { useTranslation } from '../i18n';
import { hexToHsl, hslToHex } from '../utils/colorUtils';
import MultiSelect from '../components/MultiSelect';

interface Option {
    id: string;
    name: string;
    group?: string;
}

const AdminServices: React.FC = () => {
    const { t } = useTranslation();
    const [services, setServices] = useState<Service[]>([]);
    const [softwares, setSoftwares] = useState<Software[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentService, setCurrentService] = useState<Partial<Service> | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [resServices, resSoftwares] = await Promise.all([getServices(), getSoftwares()]);
            setServices(resServices.data);
            setSoftwares(resSoftwares.data);
        } catch (error) {
            console.error("Failed to load data", error);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDelete = async (id: string) => {
        if (window.confirm(t('common.confirmDelete'))) {
            await deleteService(id);
            loadData();
        }
    };

    const handleLogoUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await uploadLogo('service', id, e.target.files[0]);
            loadData();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentService) return;

        const data = {
            ...currentService,
            children: currentService.children || [],
            parent_ids: currentService.parent_ids || []
        };

        try {
            if (currentService.id) {
                await updateService(currentService.id, data);
            } else {
                await createService(data);
            }
            setIsModalOpen(false);
            setCurrentService(null);
            loadData();
        } catch (error) {
            console.error("Failed to save service", error);
        }
    };

    const parentOptions = useMemo<Option[]>(() => [
        ...services.filter(s => s.id !== currentService?.id).map(s => ({
            id: s.id,
            name: s.name,
            group: t('nav.services')
        }))
    ], [services, currentService, t]);

    const childOptions = useMemo<Option[]>(() => [
        ...services.filter(s => s.id !== currentService?.id).map(s => ({
            id: s.id,
            name: s.name,
            group: t('nav.services')
        })),
        ...softwares.map(sw => ({
            id: sw.id,
            name: sw.name,
            group: t('nav.softwares')
        }))
    ], [services, softwares, currentService, t]);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{t('services.title')}</h2>
                <button
                    onClick={() => { setCurrentService({ name: '', color: '#3b82f6', children: [], parent_ids: [] }); setIsModalOpen(true); }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    <Plus className="mr-2 w-4 h-4" /> {t('services.create')}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => {
                    const pIds = service.parent_ids || (service.parent_id ? [service.parent_id] : []);
                    const parentNames = pIds
                        .map(pid => services.find(s => s.id === pid)?.name)
                        .filter(Boolean)
                        .join(', ');

                    return (
                    <div key={service.id} className="bg-white p-6 rounded-lg shadow-md border-t-4" style={{ borderTopColor: service.color }}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center">
                                <div className="relative w-12 h-12 border rounded overflow-hidden mr-3">
                                    {service.logo ? (
                                        <img src={`http://localhost:5000${service.logo}`} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px]">{t('common.logo')}</div>
                                    )}
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleLogoUpload(service.id, e)} />
                                </div>
                                <div>
                                    <h3 className="font-bold">{service.name}</h3>
                                    <p className="text-xs text-gray-500">{t('services.numComponents', { count: service.children.length })}</p>
                                    {parentNames && <p className="text-xs text-blue-600 mt-1">Parents: {parentNames}</p>}
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => { setCurrentService(service); setIsModalOpen(true); }} className="text-blue-600">
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(service.id)} className="text-red-600">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">{t('nav.services')}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">{t('common.name')}</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border rounded p-2"
                                    value={currentService?.name || ''}
                                    onChange={e => setCurrentService(prev => ({ ...prev!, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('softwares.parent')}</label>
                                <MultiSelect
                                    options={parentOptions}
                                    selected={currentService?.parent_ids || (currentService?.parent_id ? [currentService.parent_id] : [])}
                                    onChange={(ids) => setCurrentService(prev => ({ ...prev!, parent_ids: ids, parent_id: ids.length > 0 ? ids[0] : null }))}
                                    placeholder={t('softwares.none')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">{t('services.color')}</label>
                                <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex items-center space-x-4">
                                        <div
                                            className="w-16 h-16 rounded-2xl shadow-inner border-2 border-white"
                                            style={{ backgroundColor: currentService?.color || '#3b82f6' }}
                                        />
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                className="w-full px-3 py-1 text-sm font-mono border rounded-lg uppercase"
                                                value={currentService?.color || '#3b82f6'}
                                                onChange={e => setCurrentService(prev => ({ ...prev!, color: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-1">
                                                <span>Teinte (Hue)</span>
                                                <span>{Math.round(hexToHsl(currentService?.color || '#3b82f6')[0])}°</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="360"
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                                style={{ background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)' }}
                                                value={hexToHsl(currentService?.color || '#3b82f6')[0]}
                                                onChange={e => {
                                                    const [_, s, l] = hexToHsl(currentService?.color || '#3b82f6');
                                                    setCurrentService(prev => ({ ...prev!, color: hslToHex(parseInt(e.target.value), s, l) }));
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-1">
                                                <span>Saturation</span>
                                                <span>{Math.round(hexToHsl(currentService?.color || '#3b82f6')[1])}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100"
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                                style={{ background: `linear-gradient(to right, #ccc, ${hslToHex(hexToHsl(currentService?.color || '#3b82f6')[0], 100, 50)})` }}
                                                value={hexToHsl(currentService?.color || '#3b82f6')[1]}
                                                onChange={e => {
                                                    const [h, _, l] = hexToHsl(currentService?.color || '#3b82f6');
                                                    setCurrentService(prev => ({ ...prev!, color: hslToHex(h, parseInt(e.target.value), l) }));
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-1">
                                                <span>Luminosité</span>
                                                <span>{Math.round(hexToHsl(currentService?.color || '#3b82f6')[2])}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100"
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                                style={{ background: `linear-gradient(to right, #000, ${hslToHex(hexToHsl(currentService?.color || '#3b82f6')[0], 100, 50)}, #fff)` }}
                                                value={hexToHsl(currentService?.color || '#3b82f6')[2]}
                                                onChange={e => {
                                                    const [h, s, _] = hexToHsl(currentService?.color || '#3b82f6');
                                                    setCurrentService(prev => ({ ...prev!, color: hslToHex(h, s, parseInt(e.target.value)) }));
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">{t('services.components')}</label>
                                <MultiSelect
                                    options={childOptions}
                                    selected={currentService?.children || []}
                                    onChange={(ids) => setCurrentService(prev => ({ ...prev!, children: ids }))}
                                    placeholder={t('softwares.none')}
                                />
                            </div>
                            <div className="flex justify-end pt-4">
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
export default AdminServices;
