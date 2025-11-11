
import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import type { WishFormData, HustleIdea, LaunchPlan, UserData, User, Settings, HustleGoal, ChatHistoryItem } from '../types';

// The API key is hardcoded as requested by the user.
const ai = new GoogleGenAI({ apiKey: "AIzaSyCRU9iRGkDIXCW9WDbP3ecPlbSbavbkiUA" });

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
    The goal is to spark creativity. Make it exciting and magical.
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
  const instruction = systemInstruction || 'You are HustleGenie, an AI assistant with a witty, encouraging, and magical personality. You help users with their side hustle questions, offering advice, motivation, and creative ideas. Keep your answers concise and fun. Format longer responses into paragraphs for readability.';
  
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    history: history,
    config: {
        systemInstruction: instruction,
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

// --- DATA STORAGE SERVICE ---

const USERS_STORAGE_KEY = 'hustleGenieUsers';

const defaultPersonality = 'You are HustleGenie, an AI assistant with a witty, encouraging, and magical personality. You help users with their side hustle questions, offering advice, motivation, and creative ideas. Keep your answers concise and fun. Format longer responses into paragraphs for readability.';

export const getUsers = (): User[] => {
  try {
    const data = window.localStorage.getItem(USERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const findUserByEmail = (email: string): User | undefined => {
  return getUsers().find(u => u.email === email);
}

export const authenticateUser = (email: string, password: string): User | null => {
  const user = findUserByEmail(email);
  if (user && user.password === password) {
    return user;
  }
  return null;
}

export const addUser = (user: User): { success: boolean, error?: string } => {
  const users = getUsers();
  if (users.some(u => u.email === user.email)) {
    return { success: false, error: 'An account with this email already exists.' };
  }
  
  const updatedUsers = [...users, user];
  try {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  } catch (err) {
    return { success: false, error: "Could not create account. Your browser's storage might be full."};
  }
  
  // Create default data for the new user
  const newUserData: UserData = {
    settings: {
      theme: 'default',
      font: 'nunito',
      personality: defaultPersonality,
    },
    goals: [
        { title: 'My First Hustle', current: 0, goal: 500 },
    ],
    chatHistory: [],
  };
  saveUserData(user.email, newUserData);
  
  return { success: true };
};

const getUserDataKey = (email: string) => `hustleGenieData_${email}`;

export const getUserData = (email: string): UserData | null => {
    try {
        const data = window.localStorage.getItem(getUserDataKey(email));
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("Failed to load user data", e);
        return null;
    }
}

export const saveUserData = (email: string, data: UserData) => {
    try {
        window.localStorage.setItem(getUserDataKey(email), JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save user data", e);
    }
}

export const migrateOldData = () => {
    try {
        const oldSettingsKey = 'hustleGenieSettings';
        const oldHistoryKey = 'hustleGenieChatHistory';
        
        const oldSettingsRaw = window.localStorage.getItem(oldSettingsKey);
        const oldHistoryRaw = window.localStorage.getItem(oldHistoryKey);

        if (oldSettingsRaw || oldHistoryRaw) {
            const activeUserEmail = window.localStorage.getItem('hustleGenieActiveUser');
            if (activeUserEmail) {
                let settings: Settings = { theme: 'default', font: 'nunito', personality: defaultPersonality };
                if (oldSettingsRaw) {
                    const parsed = JSON.parse(oldSettingsRaw);
                    if (parsed.personality) settings = parsed;
                }
                
                let chatHistory: ChatHistoryItem[] = [];
                if (oldHistoryRaw) {
                    chatHistory = JSON.parse(oldHistoryRaw);
                }

                const userData = getUserData(activeUserEmail);
                if (userData) {
                    // Merge if data already exists, preferring new data unless empty
                    userData.settings = settings;
                    if (userData.chatHistory.length === 0) {
                        userData.chatHistory = chatHistory;
                    }
                    saveUserData(activeUserEmail, userData);
                }
            }

            // Clean up old keys
            window.localStorage.removeItem(oldSettingsKey);
            window.localStorage.removeItem(oldHistoryKey);
        }
    } catch (e) {
        console.error("Failed to migrate old data", e);
    }
}
