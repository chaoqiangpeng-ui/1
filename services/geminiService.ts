import { GoogleGenAI } from "@google/genai";
import { Part, PartHealth } from "../types";

export const getMaintenanceAdvice = async (
  parts: Part[],
  healthData: Record<string, PartHealth>,
  userQuery: string
): Promise<string> => {
  try {
    // For local Vite development, we use import.meta.env
    // @ts-ignore
    const apiKey = import.meta.env.VITE_API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // Construct context about the current system state
    const systemContext = parts.map(p => {
      const h = healthData[p.id];
      return `- Machine: ${p.machineId} | Part: ${p.name} (${p.category})
  Installed: ${new Date(p.installDate).toLocaleDateString()}
  Lifespan: ${p.lifespanDays} days
  Status: ${h.percentageUsed.toFixed(1)}% used (${h.status})
  Days Remaining: ${h.daysRemaining}`;
    }).join('\n');

    const prompt = `
      You are an expert industrial and mechanical maintenance advisor.
      Here is the current status of the parts in the system:
      
      ${systemContext}

      User Query: "${userQuery}"

      Based on the data above, provide a concise, helpful response. 
      If the user asks for a summary, prioritize mentioning "Critical" or "Warning" parts.
      If the user asks about a specific part, look up its details in the list above.
      If the user asks about a specific Machine ID (e.g. M-01), focus on parts for that machine.
      Keep advice practical.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful maintenance assistant. Be concise and professional.",
      }
    });

    return response.text || "I couldn't generate a response at this time.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error communicating with the maintenance AI.";
  }
};