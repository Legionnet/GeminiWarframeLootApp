import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MarketItem, Platform } from './types';
import { extractItemsFromImage } from './services/geminiService';
import { fetchItemPrices } from './services/warframeMarketService';

import Header from './components/Header';
import Footer from './components/Footer';
import ImageUploader from './components/ImageUploader';
import Loader from './components/Loader';
import PriceDisplay from './components/PriceDisplay';
import PlatformSelector from './components/PlatformSelector';

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
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const appRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
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

        try {
            if (itemNames.length === 0) {
              setIsLoading(false);
              if (timerRef.current) clearInterval(timerRef.current);
              setEta(null);
              return;
            }

            setLoadingMessage(`Found ${itemNames.length} items, fetching prices for ${platform.toUpperCase()}...`);
            
            const onItemProcessed = (item: MarketItem) => {
                setMarketItems(prevItems => [...(prevItems || []), item]);
            };

            await fetchItemPrices(itemNames, platform, onItemProcessed);

        } catch (err) {
            console.error("Market Fetching Error:", err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to fetch market prices: ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
            if (timerRef.current) clearInterval(timerRef.current);
            setEta(null);
        }
    };

    const handlePlatformChange = useCallback((newPlatform: Platform) => {
        setPlatform(newPlatform);
        // Clear previous results if platform changes, as they are now invalid
        setMarketItems(null);
        setError(null);
    }, []);
    
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
            style={{ backgroundImage: "linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.95)), url('https://picsum.photos/1920/1080?grayscale&blur=5')" }}
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
                        <ImageUploader 
                            onFileSelect={handleFileSelect}
                            onScan={handleScan}
                            onReset={resetState}
                            isProcessing={isLoading}
                            previewUrl={previewUrl}
                            error={error}
                            pasteTargetRef={appRef}
                        />
                    )}
                    {isLoading && <Loader message={loadingMessage} eta={eta} />}
                    {marketItems !== null && (
                        <PriceDisplay items={marketItems} onReset={resetState} />
                    )}
                </main>
                <Footer />
            </div>
        </div>
    );
}

export default App;