import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings, getDatasets, createDataset, setActiveDataset, importCSV } from '../api';
import { useTranslation } from '../i18n';
import { Save, Database, Plus, Check, Upload, Lock, Unlock } from 'lucide-react';

const Settings = () => {
    const { t } = useTranslation();
    const [appName, setAppName] = useState('');
    const [linkOpacity, setLinkOpacity] = useState(60);
    const [datasets, setDatasets] = useState<{name: string, hasPin: boolean}[]>([]);
    const [activeDataset, setActiveDatasetName] = useState('');
    const [newDatasetName, setNewDatasetName] = useState('');
    const [newDatasetPin, setNewDatasetPin] = useState('');
    const [unlockPin, setUnlockPin] = useState('');
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

            const activeDs = datasetsRes.data.datasets.find(d => d.name === datasetsRes.data.active);
            const currentPin = sessionStorage.getItem('dataset_pin');
            setIsLocked(!!activeDs?.hasPin && !currentPin);

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
        if (newDatasetPin && (newDatasetPin.length !== 4 || isNaN(Number(newDatasetPin)))) {
            alert("Le code PIN doit comporter 4 chiffres.");
            return;
        }
        try {
            await createDataset(newDatasetName, newDatasetPin);
            setNewDatasetName('');
            setNewDatasetPin('');
            loadData();
        } catch (error) {
            alert(t('common.error'));
        }
    };

    const handleUnlock = () => {
        const activeDs = datasets.find(d => d.name === activeDataset);
        if (activeDs?.hasPin) {
            sessionStorage.setItem('dataset_pin', unlockPin);
            window.location.reload();
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
            sessionStorage.removeItem('dataset_pin');
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
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Nom du nouveau jeu..."
                                value={newDatasetName}
                                onChange={(e) => setNewDatasetName(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                            />
                            <div className="flex space-x-2">
                                <input
                                    type="password"
                                    maxLength={4}
                                    placeholder="Code PIN (4 chiffres, optionnel)"
                                    value={newDatasetPin}
                                    onChange={(e) => setNewDatasetPin(e.target.value.replace(/\D/g, ''))}
                                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                                />
                                <button
                                    onClick={handleCreateDataset}
                                    className="px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {isLocked && (
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <p className="text-sm text-amber-800 mb-2 flex items-center">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Jeu de données verrouillé (Modification impossible)
                                </p>
                                <div className="flex space-x-2">
                                    <input
                                        type="password"
                                        maxLength={4}
                                        placeholder="PIN..."
                                        value={unlockPin}
                                        onChange={(e) => setUnlockPin(e.target.value.replace(/\D/g, ''))}
                                        className="flex-1 px-4 py-2 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 outline-none transition text-sm"
                                    />
                                    <button
                                        onClick={handleUnlock}
                                        className="px-4 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition"
                                    >
                                        <Unlock className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {!isLocked && activeDataset && datasets.find(d => d.name === activeDataset)?.hasPin && (
                            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                <p className="text-sm text-green-800 flex items-center">
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Jeu de données déverrouillé
                                </p>
                            </div>
                        )}

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
                                        {ds.hasPin && <Lock className="w-3 h-3 ml-2 text-gray-400" />}
                                    </div>
                                    {activeDataset === ds.name && <Check className="w-5 h-5 text-blue-600" />}
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('common.import')} ({activeDataset})
                            </label>
                            <input
                                type="file"
                                id="csv-import"
                                style={{ display: 'none' }}
                                accept=".csv"
                                onChange={handleImportCSV}
                            />
                            <button
                                onClick={() => document.getElementById('csv-import')?.click()}
                                className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
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
