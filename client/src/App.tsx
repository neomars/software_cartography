import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutGrid, Database, Play, Languages, Settings as SettingsIcon, Network } from 'lucide-react';
import AdminSoftwares from './pages/AdminSoftwares';
import AdminServices from './pages/AdminServices';
import Settings from './pages/Settings';
import Structure from './pages/Structure';
import Visualization from './pages/Visualization';
import Visualization2D from './pages/Visualization2D';
import { useTranslation } from './i18n';
import { getSettings } from './api';

function App() {
  const { t, toggleLang, lang } = useTranslation();
  const [appName, setAppName] = useState('Viz3D');

  useEffect(() => {
    getSettings().then(res => setAppName(res.data.appName)).catch(() => {});
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex">
        <nav className="w-64 bg-white shadow-md flex flex-col">
          <div className="p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">{appName}</h1>
            <button onClick={toggleLang} className="p-1 hover:bg-gray-100 rounded text-gray-500 flex items-center">
              <Languages className="w-4 h-4 mr-1" />
              <span className="text-xs uppercase font-bold">{lang}</span>
            </button>
          </div>
          <ul className="mt-6 flex-1">
            <li className="px-6 py-3 hover:bg-gray-50"><Link to="/" className="flex items-center text-gray-700"><Play className="mr-3 w-5 h-5" />{t('nav.viz')}</Link></li>
            <li className="px-6 py-3 hover:bg-gray-50"><Link to="/2d" className="flex items-center text-gray-700"><LayoutGrid className="mr-3 w-5 h-5" />{t('nav.viz2d')}</Link></li>
            <li className="px-6 py-3 hover:bg-gray-50"><Link to="/admin/softwares" className="flex items-center text-gray-700"><Database className="mr-3 w-5 h-5" />{t('nav.softwares')}</Link></li>
            <li className="px-6 py-3 hover:bg-gray-50"><Link to="/admin/services" className="flex items-center text-gray-700"><LayoutGrid className="mr-3 w-5 h-5" />{t('nav.services')}</Link></li>
            <li className="px-6 py-3 hover:bg-gray-50"><Link to="/admin/structure" className="flex items-center text-gray-700"><Network className="mr-3 w-5 h-5" />{t('nav.structure')}</Link></li>
            <li className="px-6 py-3 hover:bg-gray-50"><Link to="/admin/settings" className="flex items-center text-gray-700"><SettingsIcon className="mr-3 w-5 h-5" />{t('nav.settings')}</Link></li>
          </ul>
        </nav>
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Visualization />} />
            <Route path="/2d" element={<Visualization2D />} />
            <Route path="/admin/softwares" element={<AdminSoftwares />} />
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/structure" element={<Structure />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
export default App;
