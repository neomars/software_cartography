import React, { useState, useMemo } from 'react';
import * as Icons from '@tabler/icons-react';
import { Search, X } from 'lucide-react';
import { useTranslation } from '../i18n';

interface IconPickerProps {
    selectedIcon?: string;
    onSelect: (iconName: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const iconList = useMemo(() => {
        return Object.keys(Icons)
            .filter(name => name.startsWith('Icon'))
            .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 100); // Limit to 100 for performance
    }, [searchTerm]);

    const SelectedIconComponent = selectedIcon ? (Icons as any)[selectedIcon] : null;

    return (
        <div className="relative">
            <div
                className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                {SelectedIconComponent ? (
                    <SelectedIconComponent className="w-6 h-6 mr-2" />
                ) : (
                    <div className="w-6 h-6 mr-2 border-2 border-dashed rounded flex items-center justify-center text-gray-300">?</div>
                )}
                <span className="text-sm text-gray-600 truncate">
                    {selectedIcon || t('common.selectIcon')}
                </span>
            </div>

            {isOpen && (
                <div className="absolute z-[60] mt-1 w-72 bg-white border rounded-lg shadow-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold">{t('common.chooseIcon')}</h4>
                        <button onClick={() => setIsOpen(false)}><X className="w-4 h-4" /></button>
                    </div>

                    <div className="relative mb-3">
                        <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('common.search')}
                            className="w-full pl-8 pr-4 py-2 border rounded text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
                        {iconList.map((iconName) => {
                            const IconComponent = (Icons as any)[iconName];
                            return (
                                <button
                                    key={iconName}
                                    type="button"
                                    title={iconName}
                                    className={`p-2 rounded hover:bg-blue-50 flex items-center justify-center transition-colors ${selectedIcon === iconName ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-600' : 'text-gray-600'}`}
                                    onClick={() => {
                                        onSelect(iconName);
                                        setIsOpen(false);
                                    }}
                                >
                                    <IconComponent className="w-6 h-6" />
                                </button>
                            );
                        })}
                    </div>
                    {iconList.length === 0 && (
                        <div className="text-center py-4 text-gray-400 text-sm">{t('common.noResults')}</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default IconPicker;
