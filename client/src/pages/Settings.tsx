import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings, getDatasets, createDataset, setActiveDataset } from '../api';
import { useTranslation } from '../i18n';
import { Save, Database, Plus, Check } from 'lucide-react';

const Settings = () => {
    const { t } = useTranslation();
    const [appName, setAppName] = useState('');
    const [linkOpacity, setLinkOpacity] = useState(60);
    const [datasets, setDatasets] = useState<string[]>([]);
    const [activeDataset, setActiveDatasetName] = useState('');
    const [newDatasetName, setNewDatasetName] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const loadData = async () => {
        try {
            const [settingsRes, datasetsRes] = await Promise.all([getSettings(), getDatasets()]);
            setAppName(settingsRes.data.appName);
            setLinkOpacity(settingsRes.data.linkOpacity !== undefined ? settingsRes.data.linkOpacity : 60);
            setDatasets(datasetsRes.data.datasets);
            setActiveDatasetName(datasetsRes.data.active);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load settings", error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSaveSettings = async () => {
        try {
            await updateSettings({ appName, linkOpacity: Number(linkOpacity) });
            setMessage(t('common.success'));
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            setMessage(t('common.error'));
        }
    };

    const handleCreateDataset = async () => {
        if (!newDatasetName) return;
        try {
            await createDataset(newDatasetName);
            setNewDatasetName('');
            loadData();
        } catch (error) {
            alert(t('common.error'));
        }
    };

    const handleSwitchDataset = async (name: string) => {
        try {
            await setActiveDataset(name);
            loadData();
            window.location.reload();
        } catch (error) {
            alert(t('common.error'));
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">{t('settings.title')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* General Settings */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-6 flex items-center">
                        <Save className="w-5 h-5 mr-2 text-blue-600" />
                        {t('settings.title')}
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('settings.appName')}
                            </label>
                            <input
                                type="text"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('settings.linkOpacity')} ({linkOpacity}%)
                            </label>
                            <input
                                type="range" min="0" max="100" value={linkOpacity}
                                onChange={(e) => setLinkOpacity(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <button
                            onClick={handleSaveSettings}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
                        >
                            <Save className="w-5 h-5" />
                            <span>{t('common.save')}</span>
                        </button>

                        {message && (
                            <p className={`text-sm ${message === t('common.success') ? 'text-green-600' : 'text-red-600'}`}>
                                {message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Dataset Management */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-6 flex items-center">
                        <Database className="w-5 h-5 mr-2 text-blue-600" />
                        {t('common.dataset')}
                    </h2>

                    <div className="space-y-4">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="Nouveau jeu de données..."
                                value={newDatasetName}
                                onChange={(e) => setNewDatasetName(e.target.value)}
                                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                            />
                            <button
                                onClick={handleCreateDataset}
                                className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {datasets.map(ds => (
                                <div
                                    key={ds}
                                    onClick={() => handleSwitchDataset(ds)}
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                                        activeDataset === ds
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-100 hover:border-blue-200'
                                    }`}
                                >
                                    <span className="font-medium text-gray-700">{ds}</span>
                                    {activeDataset === ds && <Check className="w-5 h-5 text-blue-600" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
