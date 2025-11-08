import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import type { WishFormData, HustleIdea, LaunchPlan, ChatMessage } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// This type is based on the expected structure for the Gemini API history.
type GeminiHistory = {
  role: "user" | "model";
  parts: { text: string }[];
}[];

const hustleIdeasResponseSchema = {
  type: Type.OBJECT,
  properties: {
    ideas: {
      type: Type.ARRAY,
      description: "An array of 3 side hustle ideas.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "A creative and catchy name for the side hustle. e.g. 'Freelance Copy Genie'",
          },
          description: {
            type: Type.STRING,
            description: "A brief, magical-sounding description of the hustle.",
          },
          timeCommitment: {
            type: Type.STRING,
            description: "Estimated time commitment per week (e.g., '5–10 hrs/week').",
          },
          estimatedEarnings: {
            type: Type.STRING,
            description: "A potential monthly earning range (e.g., '$150–$500/mo').",
          },
          hustleSteps: {
            type: Type.ARRAY,
            description: "A list of 3 simple, actionable first steps to start the hustle. e.g. ['1. Find clients', '2. Set pricing', '3. Build portfolio']",
            items: {
              type: Type.STRING,
            },
          },
        },
         required: ["title", "description", "timeCommitment", "estimatedEarnings", "hustleSteps"],
      },
    },
  },
  required: ["ideas"],
};

const launchPlanResponseSchema = {
    type: Type.OBJECT,
    properties: {
        plan: {
            type: Type.ARRAY,
            description: "A 7-day step-by-step launch plan.",
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.NUMBER, description: "The day number (1-7)." },
                    title: { type: Type.STRING, description: "A creative title for the day's activities, e.g., 'Day 1: The Grand Opening'." },
                    tasks: {
                        type: Type.ARRAY,
                        description: "A list of 2-4 specific, actionable tasks for that day.",
                        items: { type: Type.STRING }
                    }
                },
                required: ["day", "title", "tasks"]
            }
        }
    },
    required: ["plan"]
};


export const generateHustleIdeas = async (
  formData: WishFormData
): Promise<HustleIdea[]> => {
  const { skills, time, location, goal } = formData;

  const prompt = `
    Based on my wishes, conjure up 3 side hustle ideas for me. Be creative and encouraging!

    My skills are: "${skills}"
    I can commit: "${time}" per week.
    I prefer: "${location}" hustles.
    My main goal is: "${goal}".

    Generate ideas that are a good match for these criteria.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are HustleGenie, an AI assistant that helps people discover profitable side hustles. Your personality is witty, encouraging, and a bit magical. Your goal is to provide creative and actionable side hustle ideas based on the user's input. Respond with exactly 3 ideas in the requested JSON format.",
        responseMimeType: "application/json",
        responseSchema: hustleIdeasResponseSchema,
      },
    });

    const responseText = response.text.trim();
    const parsedJson = JSON.parse(responseText);
    
    if (parsedJson && parsedJson.ideas && Array.isArray(parsedJson.ideas)) {
      return parsedJson.ideas;
    } else {
      throw new Error("Invalid JSON structure received from API.");
    }
  } catch (error) {
    console.error("Error generating hustle ideas:", error);
    throw new Error("Failed to get ideas from Gemini API.");
  }
};

export const generateInspirationalIdea = async (): Promise<HustleIdea[]> => {
  const prompt = `
    Conjure up ONE unique and inspiring side hustle idea. 
    It could be something creative, tech-focused, or a simple service with a unique twist. 
    The goal is to spark creativity. Make it sound exciting and magical.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are HustleGenie, an AI assistant that provides a single, inspiring side hustle idea to spark creativity. Your personality is witty, encouraging, and a bit magical. Respond with exactly 1 idea in the requested JSON format.",
        responseMimeType: "application/json",
        responseSchema: hustleIdeasResponseSchema,
      },
    });

    const responseText = response.text.trim();
    const parsedJson = JSON.parse(responseText);
    
    if (parsedJson && parsedJson.ideas && Array.isArray(parsedJson.ideas) && parsedJson.ideas.length > 0) {
      return parsedJson.ideas;
    } else {
      throw new Error("Invalid JSON structure received from API for inspirational idea.");
    }
  } catch (error) {
    console.error("Error generating inspirational idea:", error);
    throw new Error("Failed to get inspirational idea from Gemini API.");
  }
};

export const generateLaunchPlan = async (idea: HustleIdea): Promise<LaunchPlan> => {
    const prompt = `
        I've chosen a side hustle idea and I need a 7-day launch plan to get started.
        The hustle is: "${idea.title}"
        Description: "${idea.description}"

        Conjure up a magical but practical 7-day step-by-step plan. For each day, provide a creative title and a few simple, actionable tasks.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are HustleGenie, an AI assistant that creates actionable launch plans for side hustles. Your personality is encouraging and magical. Respond with exactly one 7-day plan in the requested JSON format.",
                responseMimeType: "application/json",
                responseSchema: launchPlanResponseSchema,
            },
        });

        const responseText = response.text.trim();
        const parsedJson = JSON.parse(responseText);

        if (parsedJson && parsedJson.plan && Array.isArray(parsedJson.plan)) {
            return parsedJson as LaunchPlan;
        } else {
            throw new Error("Invalid JSON structure for launch plan received from API.");
        }
    } catch (error) {
        console.error("Error generating launch plan:", error);
        throw new Error("Failed to get launch plan from Gemini API.");
    }
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        throw new Error("No image data found in response.");

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image from Gemini API.");
    }
};


export const startChatSession = (history?: GeminiHistory, systemInstruction?: string): Chat => {
  const defaultInstruction = 'You are HustleGenie, an AI assistant with a witty, encouraging, and magical personality. You help users with their side hustle questions, offering advice, motivation, and creative ideas. Keep your answers concise and fun. Format longer responses into paragraphs for readability.';
  
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    history: history,
    config: {
        systemInstruction: systemInstruction || defaultInstruction,
    },
  });
};

export const sendMessageToGenie = async (chat: Chat, message: string): Promise<string> => {
    try {
        const response = await chat.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        return "Oops! My magic lamp seems to be on the fritz. Please try again in a moment.";
    }
};