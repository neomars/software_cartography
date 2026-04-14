import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings, getDatasets, createDataset, setActiveDataset, importCSV, renameDataset, lockDataset } from '../api';
import { useTranslation } from '../i18n';
import { Save, Database, Plus, Check, Upload, Lock, Unlock, Edit2, Download } from 'lucide-react';

const Settings = () => {
    const { t } = useTranslation();
    const [appName, setAppName] = useState('');
    const [linkOpacity, setLinkOpacity] = useState(60);
    const [datasets, setDatasets] = useState<{name: string, locked: boolean}[]>([]);
    const [activeDataset, setActiveDatasetName] = useState('');
    const [newDatasetName, setNewDatasetName] = useState('');
    const [editDatasetName, setEditDatasetName] = useState('');
    const [isEditingDataset, setIsEditingDataset] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const loadData = async () => {
        try {
            const [settingsRes, datasetsRes] = await Promise.all([getSettings(), getDatasets()]);
            setAppName(settingsRes.data.appName);
            setLinkOpacity(settingsRes.data.linkOpacity !== undefined ? settingsRes.data.linkOpacity : 60);
            setDatasets(datasetsRes.data.datasets);
            setActiveDatasetName(datasetsRes.data.active);
            setEditDatasetName(datasetsRes.data.active);

            const activeDs = datasetsRes.data.datasets.find(d => d.name === datasetsRes.data.active);
            setIsLocked(!!activeDs?.locked);

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

    const handleRenameDataset = async () => {
        if (!editDatasetName || editDatasetName === activeDataset) {
            setIsEditingDataset(false);
            return;
        }
        try {
            await renameDataset(activeDataset, editDatasetName);
            setIsEditingDataset(false);
            loadData();
            window.location.reload();
        } catch (error) {
            alert(t('common.error'));
        }
    };

    const handleToggleLock = async () => {
        try {
            await lockDataset(!isLocked);
            loadData();
        } catch (error) {
            alert(t('common.error'));
        }
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                await importCSV(e.target.files[0]);
                alert(t('common.success'));
                loadData();
            } catch (error) {
                alert(t('common.error'));
            }
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
                        {/* Active Dataset Rename and Lock */}
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Jeu Actif</span>
                                <button
                                    onClick={handleToggleLock}
                                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-bold transition-colors ${
                                        isLocked ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                >
                                    {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                    <span>{isLocked ? 'Verrouillé' : 'Libre'}</span>
                                </button>
                            </div>

                            <div className="flex space-x-2">
                                {isEditingDataset ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editDatasetName}
                                            onChange={(e) => setEditDatasetName(e.target.value)}
                                            className="flex-1 px-3 py-1.5 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleRenameDataset}
                                            className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1 font-bold text-gray-800 py-1.5">{activeDataset}</div>
                                        <button
                                            onClick={() => setIsEditingDataset(true)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Create New Dataset */}
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="Nouveau jeu..."
                                value={newDatasetName}
                                onChange={(e) => setNewDatasetName(e.target.value)}
                                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                            />
                            <button
                                onClick={handleCreateDataset}
                                className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Dataset List */}
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {datasets.map(ds => (
                                <div
                                    key={ds.name}
                                    onClick={() => handleSwitchDataset(ds.name)}
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                                        activeDataset === ds.name
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-100 hover:border-blue-200'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <span className="font-medium text-gray-700">{ds.name}</span>
                                        {ds.locked && <Lock className="w-3 h-3 ml-2 text-gray-400" />}
                                    </div>
                                    {activeDataset === ds.name && <Check className="w-5 h-5 text-blue-600" />}
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t mt-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('common.import')} ({activeDataset})
                                </label>
                                <a
                                    href="/template_import.csv"
                                    download
                                    className="text-xs flex items-center text-blue-600 hover:text-blue-800 transition-colors font-bold"
                                >
                                    <Download className="w-3 h-3 mr-1" />
                                    Modèle CSV
                                </a>
                            </div>
                            <input
                                type="file"
                                id="csv-import"
                                style={{ display: 'none' }}
                                accept=".csv"
                                onChange={handleImportCSV}
                            />
                            <button
                                onClick={() => document.getElementById('csv-import')?.click()}
                                disabled={isLocked}
                                className={`w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl transition ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
                            >
                                <Upload className="w-5 h-5" />
                                <span>{t('common.import')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
