import React, { useRef, useEffect, useState } from 'react';

interface ImageUploaderProps {
    onFileSelect: (file: File) => void;
    onScan: () => void;
    onReset: () => void;
    isProcessing: boolean;
    previewUrl: string | null;
    error: string | null;
    pasteTargetRef: React.RefObject<HTMLDivElement>;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, onScan, onReset, isProcessing, previewUrl, error, pasteTargetRef }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Detect if the user agent indicates a mobile device.
        const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile(mobileCheck);
        
        const handlePaste = (event: ClipboardEvent) => {
            const items = event.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const file = new File([blob], "pasted_image.png", { type: blob.type });
                        onFileSelect(file);
                        event.preventDefault();
                        return;
                    }
                }
            }
        };
        
        const pasteTarget = pasteTargetRef.current;

        // Only add the paste listener on non-mobile devices and if the target element exists.
        if (!mobileCheck && pasteTarget) {
            pasteTarget.addEventListener('paste', handlePaste);

            return () => {
                pasteTarget.removeEventListener('paste', handlePaste);
            };
        }
    }, [onFileSelect, pasteTargetRef]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onFileSelect(event.target.files[0]);
        }
    };

    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleCameraButtonClick = () => {
        cameraInputRef.current?.click();
    };

    return (
        <div className="w-full max-w-xl mx-auto bg-gray-800 border border-gray-700 rounded-lg p-6 flex flex-col items-center">
            {!previewUrl && (
                 <div className="w-full flex flex-col items-center">
                    <div className="flex flex-wrap justify-center gap-4">
                        <button 
                            onClick={handleFileButtonClick}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75"
                        >
                            Select Screenshot
                        </button>
                        {isMobile && (
                            <button 
                                onClick={handleCameraButtonClick}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75"
                            >
                                Take Photo
                            </button>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                    />
                     <input
                        type="file"
                        ref={cameraInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                    />
                    {!isMobile && (
                        <p className="text-gray-400 mt-4 text-sm">Or press Ctrl+V to paste an image.</p>
                    )}
                </div>
            )}
            
            {previewUrl && (
                <div className="w-full flex flex-col items-center">
                    <h3 className="text-lg font-semibold mb-4">Image Preview</h3>
                    <img src={previewUrl} alt="Screenshot preview" className="max-w-full max-h-64 rounded-md border-2 border-gray-600"/>
                    <div className="flex space-x-4 mt-6">
                        <button
                            onClick={onReset}
                            disabled={isProcessing}
                            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Change Image
                        </button>
                        <button
                            onClick={onScan}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Scan Prices
                        </button>
                    </div>
                </div>
            )}
             {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>
    );
};

export default ImageUploader;