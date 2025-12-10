import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is not defined.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateAnnouncement = async (topic: string, tone: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Error: API Key missing.";

  try {
    const prompt = `Write a professional internal company announcement about: "${topic}". The tone should be ${tone}. Keep it concise (under 100 words).`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Failed to generate announcement.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content. Please check API key.";
  }
};

export const getDashboardInsights = async (attendanceStats: string, payrollStats: string): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "AI Insights unavailable (No API Key).";

    try {
        const prompt = `
        You are an HR Analytics Assistant.
        Analyze this data summary in 2 sentences max.
        Attendance Data: ${attendanceStats}
        Payroll Data: ${payrollStats}
        Provide a quick executive insight.
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "No insights available.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Could not fetch insights.";
    }
}
