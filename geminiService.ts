
import { GoogleGenAI } from "@google/genai";

export async function getAIResponse(prompt: string) {
  // Use process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are TaxWatch AI, a helpful and transparent assistant for citizen tax inquiries. 
        Focus on providing clarity about how taxes are allocated. 
        Key facts: Education (35%), Healthcare (30%), Infrastructure (15%), Defense (12%), others (8%). 
        Be professional, concise, and encourage civic engagement.`,
      }
    });
    // .text is a property getter, not a function
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble processing that right now. Please try again later.";
  }
}
