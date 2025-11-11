import { GoogleGenAI } from "@google/genai";
import { Reservation } from '../types';
import { config } from '../config';

let ai: GoogleGenAI | null = null;
if (config.geminiApiKey) {
    ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
}

export const generateDailySummary = async (currentlyBoarding: Reservation[], date: Date, allReservations: Reservation[]): Promise<string> => {
    if (!ai) {
        throw new Error("Gemini API key is not configured. Please add the API_KEY secret.");
    }
    
    const model = 'gemini-2.5-flash';

    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    const checkIns = allReservations.filter(r => isSameDay(new Date(r.startDate), date));
    const checkOuts = allReservations.filter(r => isSameDay(new Date(r.endDate), date));

    const formatReservationLine = (r: Reservation) => `- ${r.animalName} (${r.animalType}). Notes: ${r.notes || 'None'}`;

    const checkInDetails = checkIns.length > 0 
        ? checkIns.map(formatReservationLine).join('\n')
        : 'None.';
    
    const checkOutDetails = checkOuts.length > 0
        ? checkOuts.map(formatReservationLine).join('\n')
        : 'None.';

    const currentlyBoardingDetails = currentlyBoarding.map(formatReservationLine).join('\n');

    const prompt = `
      You are an assistant at a veterinary clinic. Your task is to generate a concise and professional daily handover summary for the next shift.
      The summary should be easy to read and highlight any important information. Start with arrivals and departures, then provide the full summary for all animals present today.
      
      Today is: ${formattedDate}
      
      **Animals Checking In Today:**
      ${checkInDetails}
      
      **Animals Checking Out Today:**
      ${checkOutDetails}
      
      **Full List of Boarders Present Today:**
      ${currentlyBoardingDetails}
      
      Please generate the handover summary based on the information above.
      - Start with a clear, friendly opening.
      - List any animals arriving today.
      - List any animals departing today.
      - Then, provide a brief but comprehensive summary for all animals that are staying, paying special attention to any notes (medication, diet, behavior).
      - IMPORTANT: Stick strictly to the information provided. Do not make any statements about how a pet is feeling or doing (e.g., "is happy," "is settling in well"), as you do not have this information. Only report the facts from the notes.
      - Conclude with a friendly closing.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 0.5,
                topP: 0.95,
            }
        });
        
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with the AI service.");
    }
};