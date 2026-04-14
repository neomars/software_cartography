import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface Option {
    id: string;
    name: string;
    group?: string;
}

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selected, onChange, placeholder = "Select...", disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (id: string) => {
        if (disabled) return;
        const newSelected = selected.includes(id)
            ? selected.filter(s => s !== id)
            : [...selected, id];
        onChange(newSelected);
    };

    const selectedOptions = options.filter(o => selected.includes(o.id));

    // Group options
    const groupedOptions = options.reduce((acc, opt) => {
        const group = opt.group || 'Default';
        if (!acc[group]) acc[group] = [];
        acc[group].push(opt);
        return acc;
    }, {} as Record<string, Option[]>);

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                className={`min-h-[42px] p-2 border rounded flex flex-wrap gap-1 items-center pr-8 transition-colors ${
                    disabled
                        ? 'bg-gray-50 cursor-not-allowed border-gray-200'
                        : 'bg-white cursor-pointer border-gray-300 hover:border-blue-400'
                }`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {selectedOptions.length === 0 ? (
                    <span className="text-gray-400 text-sm">{placeholder}</span>
                ) : (
                    selectedOptions.map(opt => (
                        <span key={opt.id} className={`text-xs px-2 py-1 rounded flex items-center ${
                            disabled ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-800'
                        }`}>
                            {opt.name}
                            {!disabled && (
                                <X
                                    className="w-3 h-3 ml-1 cursor-pointer hover:text-blue-600"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleOption(opt.id);
                                    }}
                                />
                            )}
                        </span>
                    ))
                )}
                <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute z-[100] mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                    {Object.entries(groupedOptions).map(([group, groupOpts]) => (
                        <div key={group}>
                            {group !== 'Default' && (
                                <div className="px-3 py-1 text-xs font-bold text-gray-500 bg-gray-50 uppercase tracking-wider border-y">
                                    {group}
                                </div>
                            )}
                            {groupOpts.map(opt => (
                                <div
                                    key={opt.id}
                                    className="px-3 py-2 hover:bg-gray-100 flex items-center justify-between cursor-pointer text-sm"
                                    onClick={() => toggleOption(opt.id)}
                                >
                                    <span>{opt.name}</span>
                                    {selected.includes(opt.id) && <Check className="w-4 h-4 text-blue-600" />}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
