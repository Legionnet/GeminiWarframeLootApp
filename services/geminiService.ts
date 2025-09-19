import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
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
