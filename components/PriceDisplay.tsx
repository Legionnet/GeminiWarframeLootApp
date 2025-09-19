import React from 'react';
import { MarketItem } from '../types';

interface PriceDisplayProps {
    items: MarketItem[];
    onReset: () => void;
}

const PlatinumIcon: React.FC = () => (
    <svg viewBox="0 0 100 100" className="w-4 h-4 inline-block ml-1" fill="#cbe2f8">
        <path d="M63.87,11.23,50,3.87,36.13,11.23,12.27,25.87,3.87,50,12.27,74.13,36.13,88.77,50,96.13,63.87,88.77,87.73,74.13,96.13,50,87.73,25.87Z" />
    </svg>
);


const PriceDisplay: React.FC<PriceDisplayProps> = ({ items, onReset }) => {
    return (
        <div className="w-full max-w-4xl mx-auto mt-8">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-cyan-400">Scan Results</h2>
                <button
                    onClick={onReset}
                    className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300"
                >
                    Scan Another Image
                </button>
            </div>
            {items.length === 0 ? (
                <p className="text-center text-gray-400 bg-gray-800 p-6 rounded-lg">
                    Could not identify any items in the image. Please try another screenshot.
                </p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <a 
                            key={item.urlName}
                            href={`https://warframe.market/items/${item.urlName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col justify-between bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 hover:border-cyan-500 transition-all duration-300"
                        >
                            <h3 className="font-semibold text-lg text-gray-100 truncate mb-3" title={item.name}>{item.name}</h3>
                           
                            {item.error ? (
                                <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">
                                    <p className="font-bold">Error:</p>
                                    <p>{item.error}</p>
                                </div>
                            ) : (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-gray-400">Lowest Price:</span>
                                        {item.lowestPrice !== null ? (
                                            <div className="flex items-center text-cyan-300 font-bold">
                                                <span>{item.lowestPrice}</span>
                                                <PlatinumIcon />
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">N/A</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-gray-400">48h Avg Price:</span>
                                        {item.avgPrice !== null ? (
                                            <div className="flex items-center text-gray-300">
                                                <span>{item.avgPrice}</span>
                                                <PlatinumIcon />
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">N/A</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-gray-400">Sold (48h):</span>
                                        <span className={`font-semibold ${item.soldCount !== null ? 'text-gray-100' : 'text-gray-500'}`}>
                                            {item.soldCount !== null ? item.soldCount : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PriceDisplay;