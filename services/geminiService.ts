import { GoogleGenerativeAI } from "@google/generative-ai";

// Get the key the VITE way (this is the only way it works in the browser with Vercel)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;

if (!apiKey) {
  console.error(
    "Gemini API key not found. Please set VITE_GEMINI_API_KEY (or VITE_API_KEY) in Vercel Environment Variables."
  );
}

// Only initialize if we have a key
let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export const generateDailySummary = async (
  currentlyBoarding: Reservation[],
  date: Date,
  allReservations: Reservation[]
): Promise<string> => {
  if (!genAI) {
    throw new Error(
      "Gemini AI is not available. Please add VITE_GEMINI_API_KEY in Vercel → Settings → Environment Variables."
    );
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const checkIns = allReservations.filter((r) =>
    isSameDay(new Date(r.startDate), date)
  );
  const checkOuts = allReservations.filter((r) =>
    isSameDay(new Date(r.endDate), date)
  );

  const formatReservationLine = (r: any) =>
    `- ${r.animalName} (${r.animalType})${
      r.ownerFirstName ? ` - ${r.ownerFirstName}` : ""
    }. Notes: ${r.notes || "None"}`;

  const checkInDetails =
    checkIns.length > 0 ? checkIns.map(formatReservationLine).join("\n") : "None.";
  const checkOutDetails =
    checkOuts.length > 0 ? checkOuts.map(formatReservationLine).join("\n") : "None.";
  const currentlyBoardingDetails = currentlyBoarding
    .map(formatReservationLine)
    .join("\n");

  const prompt = `
You are a veterinary clinic assistant creating a professional daily handover for the next shift.

Today is: ${formattedDate}

ARRIVALS TODAY:
${checkInDetails}

DEPARTURES TODAY:
${checkOutDetails}

CURRENT BOARDERS (full details):
${currentlyBoardingDetails}

Please write a clear, concise, professional handover summary. 
- Begin with a friendly greeting
- List arrivals and departures
- Summarize each current boarder with their key notes (meds, diet, behavior)
- Only use the information provided — do NOT add feelings or assumptions
- End with a friendly sign-off
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate AI summary. Please try again later.");
  }
};
