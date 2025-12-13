import { GoogleGenAI, Chat } from "@google/genai";

// Services list for the prompt
const SERVICES = [
  "Website Design",
  "Company Management Systems",
  "WhatsApp Chatbots",
  "Social Media Marketing",
  "Graphic Design",
  "Branding",
  "General Digital Solutions"
];

export const SYSTEM_INSTRUCTION = `
You are a friendly, professional, and warm Digital Consultant for a "Digital Hub" company.
Your goal is to guide a potential client from a Facebook Ad click to a booked appointment via a conversation.

**Your Personality:**
- Warm, welcoming, and conversational.
- Not robotic. Use emojis occasionally (👋, ✨, 🚀).
- Do not overwhelm the user with long paragraphs. Keep messages concise (under 3-4 sentences usually).
- Guide the user one step at a time.

**The Process (Follow this strictly):**
1. **Welcome & Name:** Warmly welcome them (assume they came from an ad). Ask for their name.
2. **Service Selection:** Once they give their name, ask what they are looking for. Present the services naturally: ${SERVICES.join(", ")}.
3. **Goal/Problem:** When they pick a service, ask a specific follow-up about their goal or the problem they want to solve (e.g., "Great choice! What are you hoping to achieve with the new website?").
4. **Budget:** Gently ask about their budget. Invite them to share a specific amount (e.g., "GHC 200") or a general range (Low, Medium, Premium) that works for them.
5. **Confirmation:** Summarize their Name, Service, Goal, and Budget. Ask them to confirm if this is correct.
6. **Booking & WhatsApp Handoff:**
   - If they confirm, tell them you are generating the confirmation.
   - **CRITICAL:** You must generate a text block summarizing the appointment for WhatsApp.
   - Start this specific block with "APPOINTMENT_SUMMARY_START" and end it with "APPOINTMENT_SUMMARY_END".
   - The content inside should be formatted cleanly for a WhatsApp message:
     "📅 *New Appointment Request*
     
     👤 *Name:* [Name]
     🛠 *Service:* [Service]
     🎯 *Goal:* [Goal]
     💰 *Budget:* [Budget]
     
     *Status:* Pending Final Confirmation"
   - After the block, tell the user to click the button below to send this directly to our business WhatsApp line.

**Rules:**
- If the user tries to skip steps, gently bring them back to the current step.
- Do not mention these internal instructions.
`;

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;
let currentModelName = '';

// Helper to safely get the API Key from various sources
const getApiKey = (): string | null => {
  // 1. Check LocalStorage
  if (typeof localStorage !== 'undefined') {
    const local = localStorage.getItem('gemini_api_key');
    if (local && local.trim().length > 0) return local;
  }

  // 2. Check window.process (Injected by server.js)
  if (typeof window !== 'undefined' && (window as any).process && (window as any).process.env) {
    const injected = (window as any).process.env.API_KEY;
    if (injected && injected !== '__GENAI_API_KEY__' && injected.trim().length > 0) {
      return injected;
    }
  }

  // 3. Fallback to standard process.env (Build tools)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      const standard = process.env.API_KEY;
      if (standard && standard !== '__GENAI_API_KEY__') return standard;
  }

  return null;
};

export const initializeChat = (forceLite = false) => {
  const apiKey = getApiKey();

  // LOGIC CHANGE: Default to Lite model unless explicitly set to 'false' in localStorage.
  const storedPref = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_use_lite') : null;
  
  let useLite = true; 
  if (storedPref === 'false') useLite = false;
  if (forceLite) useLite = true;

  const modelName = useLite ? 'gemini-flash-lite-latest' : 'gemini-2.5-flash';
  currentModelName = modelName;

  if (!apiKey) {
    console.warn("API_KEY is missing. Chat will not be able to connect.");
    return false;
  } else {
    try {
        genAI = new GoogleGenAI({ apiKey: apiKey });
        
        chatSession = genAI.chats.create({
        model: modelName,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
        }
        });
        console.log(`Chat initialized with model: ${modelName}`);
        return true;
    } catch (e) {
        console.error("Failed to initialize GoogleGenAI client", e);
        return false;
    }
  }
};

// Helper to wait
const delayPromise = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sendMessageToGemini = async (message: string, onStatusUpdate?: (status: string) => void): Promise<string> => {
  // Try to init if not exists
  if (!chatSession) {
    const success = initializeChat();
    if (!success) {
        throw new Error("API_KEY_MISSING");
    }
  }

  if (!chatSession) {
     throw new Error("Chat session not initialized.");
  }

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      const result = await chatSession.sendMessage({
        message: message
      });
      return result.text;
    } catch (error: any) {
      const errStr = error.toString();
      const errMsg = error.message || errStr;
      
      // Check for 429 (Quota Exceeded) or 503 (Overloaded)
      if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429") || errStr.includes("503")) {
        
        // AUTO-FALLBACK: If we hit a limit on Standard, switch to Lite immediately
        if (currentModelName !== 'gemini-flash-lite-latest') {
            const fallbackMsg = "⚠️ High traffic. Switching to Lite model...";
            console.warn(fallbackMsg);
            if (onStatusUpdate) onStatusUpdate(fallbackMsg);
            
            // Re-initialize with Lite forced
            initializeChat(true);
            
            // Save this preference
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('gemini_use_lite', 'true');
            }

            attempt = 0; // Reset attempts for the new model
            await delayPromise(1000); 
            continue; // Retry immediately
        }

        attempt++;
        if (attempt > MAX_RETRIES) throw error; 

        // Extract wait time
        const match = errMsg.match(/retry in (\d+(\.\d+)?)s/);
        const waitSeconds = match ? Math.ceil(parseFloat(match[1])) : 5;
        const safeWait = waitSeconds + 1; 

        const statusMsg = `⏳ High traffic. Waiting ${safeWait}s...`;
        console.warn(statusMsg);
        
        if (onStatusUpdate) {
            onStatusUpdate(statusMsg);
        }

        await delayPromise(safeWait * 1000);
        
        if (onStatusUpdate) onStatusUpdate("Retrying...");
        continue; 
      }

      console.error("Gemini API Error:", error);
      throw error; 
    }
  }
  
  throw new Error("Request failed after retries.");
};