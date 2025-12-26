
import { GoogleGenAI, Type } from "@google/genai";
import { TAX_ALLOCATION_DATA, MOCK_SECTOR_WORKS } from "./constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Circuit Breaker State
let isQuotaExhausted = false;
let cooldownExpiry = 0;

const COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes

function checkCircuitBreaker() {
  if (isQuotaExhausted && Date.now() < cooldownExpiry) {
    return true;
  }
  isQuotaExhausted = false;
  return false;
}

function tripCircuitBreaker() {
  isQuotaExhausted = true;
  cooldownExpiry = Date.now() + COOLDOWN_DURATION;
  console.warn("AI Core Quota Tripped. Entering 5-minute cooldown.");
}

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

async function callGeminiWithRetry(params: any, retries = 1) {
  if (checkCircuitBreaker()) return null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent(params);
      return response.text;
    } catch (error: any) {
      const status = error?.status || (error?.message?.includes('429') ? 429 : 500);
      
      if (status === 429) {
        tripCircuitBreaker();
        return null;
      }
      
      if (i < retries - 1) {
        await wait(2000 * (i + 1));
        continue;
      }
    }
  }
  return null;
}

export async function getRealTaxData() {
  try {
    const text = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      contents: "Generate a realistic national tax allocation dataset. Include Education, Healthcare, Infrastructure, Defense, and Social Welfare. Provide percentage (0-100), HEX color, and amount in Crores.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sectors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  color: { type: Type.STRING },
                  amountCr: { type: Type.NUMBER }
                },
                required: ["name", "value", "color", "amountCr"]
              }
            }
          },
          required: ["sectors"]
        }
      }
    });
    
    if (text) {
      const data = JSON.parse(text);
      return data.sectors;
    }
    return TAX_ALLOCATION_DATA;
  } catch (error) {
    return TAX_ALLOCATION_DATA;
  }
}

export async function getSectorWorks(sectorName: string) {
  try {
    const text = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      contents: `Generate 4 realistic projects for ${sectorName}. Include name, description, status, progress (0-100), assignedBudget, spentBudget.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            works: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  status: { type: Type.STRING },
                  progress: { type: Type.NUMBER },
                  assignedBudget: { type: Type.NUMBER },
                  spentBudget: { type: Type.NUMBER }
                },
                required: ["id", "name", "description", "status", "progress", "assignedBudget", "spentBudget"]
              }
            }
          },
          required: ["works"]
        }
      }
    });
    
    if (text) {
      const data = JSON.parse(text);
      return data.works.map((w: any) => ({ ...w, feedbacks: [] }));
    }
    return MOCK_SECTOR_WORKS[sectorName] || MOCK_SECTOR_WORKS['Education'];
  } catch (error) {
    return MOCK_SECTOR_WORKS[sectorName] || MOCK_SECTOR_WORKS['Education'];
  }
}

export async function getAIResponse(prompt: string) {
  if (checkCircuitBreaker()) {
    return "AI Core is currently resting to prevent quota overflow. Please try again in a few minutes. Local heuristics suggest checking your tax dashboard for current allocation data.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are TaxWatch AI. Provide high-fidelity, professional insights into tax usage. If you cannot provide real-time data, explain the general fiscal concepts instead.`,
      }
    });
    return response.text;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('429')) {
      tripCircuitBreaker();
    }
    return "The analytical core is currently undergoing maintenance. Using local heuristic engine for basic queries.";
  }
}
