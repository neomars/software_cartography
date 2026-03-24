import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../api';
import { useTranslation } from '../i18n';
import { Save } from 'lucide-react';

const Settings = () => {
    const { t } = useTranslation();
    const [appName, setAppName] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        getSettings().then(res => {
            setAppName(res.data.appName);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        try {
            await updateSettings({ appName });
            setMessage(t('common.success'));
            // Refresh page to update header in App.tsx
            window.location.reload();
        } catch (error) {
            setMessage(t('common.error'));
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">{t('settings.title')}</h1>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('settings.appName')}
                        </label>
                        <input
                            type="text"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        />
                    </div>

                    <button
                        onClick={handleSave}
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
        </div>
    );
};

export default Settings;
