import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MarketItem, Platform, WarframeMarketItemShort } from '../types';
import { extractItemsFromImage } from '../services/geminiService';
import { fetchItemPrices, fetchAllItems } from '../services/warframeMarketService';

import Header from './Header';
import Footer from './Footer';
import ImageUploader from './ImageUploader';
import Loader from './Loader';
import PriceDisplay from './PriceDisplay';
import PlatformSelector from './PlatformSelector';
import ItemSearch from './ItemSearch';

const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                return reject(new Error("Failed to read file"));
            }
            const [mimeString, base64Data] = reader.result.split(',');
            const mimeType = mimeString.split(':')[1].split(';')[0];
            resolve({ base64: base64Data, mimeType });
        };
        reader.onerror = (error) => reject(error);
    });
};

function App() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [marketItems, setMarketItems] = useState<MarketItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [platform, setPlatform] = useState<Platform>('pc');
    const [eta, setEta] = useState<number | null>(null);
    const [allItems, setAllItems] = useState<WarframeMarketItemShort[]>([]);
    const [itemMap, setItemMap] = useState<Map<string, WarframeMarketItemShort>>(new Map());

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const appRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        // Fetch all item names for autocomplete on initial load
        const loadAllItems = async () => {
            const items = await fetchAllItems();
            setAllItems(items);
            // Create a map for fast lookups
            const newMap = new Map<string, WarframeMarketItemShort>();
            items.forEach(item => newMap.set(item.item_name.toLowerCase(), item));
            setItemMap(newMap);
        };
        loadAllItems();

        // Cleanup timer on component unmount
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const handleFileSelect = useCallback((file: File) => {
        resetState();
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }, []);

    const handleScan = async () => {
        if (!imageFile) return;

        setIsLoading(true);
        setError(null);
        setMarketItems([]); // Initialize for streaming results

        // Start ETA countdown
        const initialEta = 15; // A generous estimate in seconds
        setEta(initialEta);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setEta(prevEta => (prevEta !== null && prevEta > 0 ? prevEta - 1 : 0));
        }, 1000);
        
        let itemNames: string[];
        try {
            setLoadingMessage('Analyzing screenshot with AI...');
            const { base64, mimeType } = await fileToBase64(imageFile);
            itemNames = await extractItemsFromImage(base64, mimeType);
        } catch (err) {
            console.error("Gemini API Error:", err);
            setError("Failed to analyze image with AI. Please check your API key or try a different screenshot.");
            setIsLoading(false);
            if (timerRef.current) clearInterval(timerRef.current);
            setEta(null);
            setMarketItems(null); // Reset to show uploader again on AI error
            return;
        }
        
        // Keep the original order from the OCR for sorting later
        const originalItemOrder = itemNames.map(name => name.toLowerCase());

        const itemsToFetch = itemNames
            .map(name => itemMap.get(name.toLowerCase()))
            .filter((item): item is WarframeMarketItemShort => !!item);
        
        if (itemsToFetch.length === 0) {
            setIsLoading(false);
            if (timerRef.current) clearInterval(timerRef.current);
            setEta(null);
            // setMarketItems is already [] so PriceDisplay will show the "not found" message
            return;
        }

        try {
            setLoadingMessage(`Found ${itemsToFetch.length} items, fetching prices for ${platform.toUpperCase()}...`);
            
            const onItemProcessed = (item: MarketItem) => {
                setMarketItems(prevItems => {
                    const newItems = [...(prevItems || []), item];
                    // Sort based on the original order from the OCR scan
                    newItems.sort((a, b) => {
                        const indexA = originalItemOrder.indexOf(a.name.toLowerCase());
                        const indexB = originalItemOrder.indexOf(b.name.toLowerCase());
                        
                        // Items not found in original list are pushed to the end
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;

                        return indexA - indexB;
                    });
                    return newItems;
                });
            };

            await fetchItemPrices(itemsToFetch, platform, onItemProcessed);

        } catch (err) {
            console.error("Market Fetching Error:", err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to fetch market prices: ${errorMessage}`);
            setMarketItems(null); // Reset to show uploader again on market error
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
            if (timerRef.current) clearInterval(timerRef.current);
            setEta(null);
        }
    };

    const handleSearch = async (itemName: string) => {
        if (!itemName) return;

        const itemToFetch = itemMap.get(itemName.toLowerCase());
        if (!itemToFetch) {
            setError(`Could not find an item named "${itemName}". Please check the spelling or try the autocomplete suggestions.`);
            return;
        }

        setIsLoading(true);
        setError(null);
        setMarketItems([]);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setImageFile(null);

        try {
            setLoadingMessage(`Fetching price for "${itemName}" on ${platform.toUpperCase()}...`);
            
            const onItemProcessed = (item: MarketItem) => {
                setMarketItems(prevItems => [...(prevItems || []), item]);
            };

            await fetchItemPrices([itemToFetch], platform, onItemProcessed);

        } catch (err) {
            console.error("Market Fetching Error:", err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to fetch market prices: ${errorMessage}`);
            setMarketItems(null); // Reset to show input view on error
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handlePlatformChange = useCallback((newPlatform: Platform) => {
        setPlatform(newPlatform);
        // Clear previous results if platform changes, as they are now invalid
        if(marketItems !== null) {
            resetState();
        }
    }, [marketItems]);
    
    const resetState = () => {
        setImageFile(null);
        if(previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setIsLoading(false);
        setMarketItems(null);
        setError(null);
        if (timerRef.current) clearInterval(timerRef.current);
        setEta(null);
    };

    return (
        <div 
            ref={appRef}
            className="min-h-screen bg-gray-900 bg-cover bg-center" 
            style={{ backgroundImage: "linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.95)), url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1920&auto=format&fit=crop')" }}
        >
            <div className="container mx-auto px-4 py-8 flex flex-col min-h-screen">
                <Header />
                 <PlatformSelector
                    selectedPlatform={platform}
                    onPlatformChange={handlePlatformChange}
                    disabled={isLoading}
                />
                <main className="flex-grow flex flex-col items-center justify-center">
                    {marketItems === null && !isLoading && (
                         <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6">
                            <ItemSearch 
                                onSearch={handleSearch}
                                isProcessing={isLoading}
                                allItems={allItems.map(item => item.item_name)}
                            />
                            <div className="flex items-center w-full">
                                <div className="flex-grow border-t border-gray-600"></div>
                                <span className="flex-shrink mx-4 text-gray-400 font-semibold">OR</span>
                                <div className="flex-grow border-t border-gray-600"></div>
                            </div>
                            <ImageUploader 
                                onFileSelect={handleFileSelect}
                                onScan={handleScan}
                                onReset={resetState}
                                isProcessing={isLoading}
                                previewUrl={previewUrl}
                                error={error}
                                pasteTargetRef={appRef}
                            />
                        </div>
                    )}
                    {isLoading && <Loader message={loadingMessage} eta={eta} />}
                    {marketItems !== null && (
                        <PriceDisplay items={marketItems} onReset={resetState} isLoading={isLoading} />
                    )}
                </main>
                <Footer />
            </div>
        </div>
    );
}

export default App;