const OCR_API_URL = 'https://api.ocr.space/parse/image';

const resolveApiKey = (): string | undefined => {
    const viteEnv = typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string | undefined> }).env : undefined;
    const processEnv = (() => {
        try {
            const globalProcess = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
            return globalProcess?.env;
        } catch (error) {
            return undefined;
        }
    })();

    return (
        viteEnv?.VITE_OCR_SPACE_API_KEY ||
        viteEnv?.OCR_SPACE_API_KEY ||
        processEnv?.VITE_OCR_SPACE_API_KEY ||
        processEnv?.OCR_SPACE_API_KEY ||
        processEnv?.API_KEY
    );
};

const resolvedKey = resolveApiKey();
const API_KEY = resolvedKey || 'helloworld';

if (!resolvedKey) {
    console.warn('OCR_SPACE_API_KEY not set. Falling back to the OCR.Space demo key with limited throughput.');
}

interface OcrSpaceResult {
    ParsedText?: string;
}

interface OcrSpaceResponse {
    IsErroredOnProcessing: boolean;
    ParsedResults?: OcrSpaceResult[];
    ErrorMessage?: string | string[];
    ErrorDetails?: string | string[];
}

const normalizeErrorMessage = (message?: string | string[]) => {
    if (!message) return undefined;
    return Array.isArray(message) ? message.filter(Boolean).join(' ') : message;
};

export const extractItemsFromImage = async (base64Image: string, mimeType: string): Promise<string[]> => {
    try {
        const formData = new FormData();
        formData.append('base64Image', `data:${mimeType};base64,${base64Image}`);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2');

        const response = await fetch(OCR_API_URL, {
            method: 'POST',
            body: formData,
            headers: {
                apikey: API_KEY,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OCR request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data: OcrSpaceResponse = await response.json();

        if (data.IsErroredOnProcessing) {
            const message = normalizeErrorMessage(data.ErrorMessage) || normalizeErrorMessage(data.ErrorDetails) || 'The OCR service reported an error while processing the image.';
            throw new Error(message);
        }

        const combinedText = (data.ParsedResults || [])
            .map(result => result.ParsedText || '')
            .join('\n');

        return combinedText
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);
    } catch (error) {
        console.error('Error extracting text from image:', error);
        throw new Error('Failed to analyze the image with the OCR.Space API.');
    }
};
