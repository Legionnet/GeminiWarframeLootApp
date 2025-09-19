import React from 'react';
import { Platform } from '../types';

interface PlatformSelectorProps {
    selectedPlatform: Platform;
    onPlatformChange: (platform: Platform) => void;
    disabled: boolean;
}

const platforms: { id: Platform; name: string }[] = [
    { id: 'pc', name: 'PC' },
    { id: 'ps4', name: 'PlayStation' },
    { id: 'xbox', name: 'Xbox' },
    { id: 'switch', name: 'Switch' },
    { id: 'mobile', name: 'Mobile' },
];

const PlatformSelector: React.FC<PlatformSelectorProps> = ({ selectedPlatform, onPlatformChange, disabled }) => {
    return (
        <div className="w-full max-w-xl mx-auto my-6">
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                {platforms.map((platform) => (
                    <button
                        key={platform.id}
                        onClick={() => onPlatformChange(platform.id)}
                        disabled={disabled}
                        aria-pressed={selectedPlatform === platform.id}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed
                            ${selectedPlatform === platform.id
                                ? 'bg-cyan-600 text-white shadow-lg scale-105'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`
                        }
                    >
                        {platform.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PlatformSelector;