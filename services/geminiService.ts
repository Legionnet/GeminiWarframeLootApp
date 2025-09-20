import { GoogleGenAI } from "@google/genai";

// The execution environment provides the API key via process.env
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This warning will appear in the browser console if the key is missing.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
  alert("Gemini API key is not configured. Please see deployment instructions.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const extractItemsFromImage = async (base64Image: string, mimeType: string): Promise<string[]> => {
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };

        const prompt = `
            You are an expert OCR system specializing in the video game Warframe.
            Analyze this screenshot of a Warframe relic reward screen.
            Extract the exact names of the prime parts and Forma blueprints listed as rewards.
            List each item name on a new line.
            Do not include any other text, numbers, or explanations. Only provide the list of item names.
            For example, if you see "Vasto Prime Barrel", "Akstiletto Prime Link", and "Forma Blueprint", your output should be:
            Vasto Prime Barrel
            Akstiletto Prime Link
            Forma Blueprint
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                // Disable thinking for faster response on this straightforward OCR task
                thinkingConfig: { thinkingBudget: 0 },
            }
        });

        const text = response.text;
        if (!text) {
            return [];
        }

        return text.trim().split('\n').map(item => item.trim()).filter(item => item.length > 0);
    } catch (error) {
        console.error("Error extracting text from image:", error);
        throw new Error("Failed to analyze the image with Gemini API.");
    }
};