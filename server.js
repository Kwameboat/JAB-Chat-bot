// server.js
// ------------------------------------------------------------------
// BACKEND SERVER FOR WHATSAPP BOT (Render/Railway/Replit)
// ------------------------------------------------------------------
// This file handles the incoming messages from WhatsApp via AuthKey,
// sends them to Gemini AI, and returns the response.
//
// START COMMAND: node server.js

const express = require('express');
const { GoogleGenAI } = require('@google/genai');
// Dynamic import for node-fetch to handle ESM/CommonJS compatibility if needed, 
// but standard require works for v2. For v3+, dynamic import might be needed.
// We'll use standard require assuming compatible version or environment.
// If this fails, use: const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fetch = require('node-fetch'); 

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURATION ---
// Ensure these variables are set in your Render Environment Variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const AUTHKEY_AUTH_TOKEN = process.env.AUTHKEY_AUTH_TOKEN; 
const COMPANY_EMAIL = 'boatengkwm@yahoo.com';

// --- SYSTEM INSTRUCTION ---
// Copied from services/geminiService.ts to ensure standalone operation
const SERVICES_LIST = "Website Design, Company Management Systems, WhatsApp Chatbots, Social Media Marketing, Graphic Design, Branding, General Digital Solutions";

const SYSTEM_INSTRUCTION = `
You are a friendly, professional, and warm Digital Consultant for a "Digital Hub" company.
Your goal is to guide a potential client from a Facebook Ad click to a booked appointment via a conversation.
Our company email is: boatengkwm@yahoo.com

**Your Personality:**
- Warm, welcoming, and conversational.
- Not robotic. Use emojis occasionally (👋, ✨, 🚀).
- Do not overwhelm the user with long paragraphs. Keep messages concise (under 3-4 sentences usually).
- Guide the user one step at a time.

**The Process (Follow this strictly):**
1. **Welcome & Name:** Warmly welcome them (assume they came from an ad). Ask for their name.
2. **Service Selection:** Once they give their name, ask what they are looking for. Present the services naturally: ${SERVICES_LIST}.
3. **Goal/Problem:** When they pick a service, ask a specific follow-up about their goal or the problem they want to solve (e.g., "Great choice! What are you hoping to achieve with the new website?").
4. **Budget:** Gently ask about their budget. Invite them to share a specific amount (e.g., "GHC 200") or a general range (Low, Medium, Premium) that works for them.
5. **Confirmation:** Summarize their Name, Service, Goal, and Budget. Ask them to confirm if this is correct.
6. **Booking & Email:**
   - If they confirm, tell them you are booking the appointment.
   - **CRITICAL:** You must generate a text block that looks like an email summary.
   - Start this specific block with "EMAIL_SUMMARY_START" and end it with "EMAIL_SUMMARY_END".
   - The content inside should be formatted like:
     "To: boatengkwm@yahoo.com
     Subject: New Appointment: [Service] - [Name]
     
     Name: [Name]
     Service: [Service]
     Goal: [Goal]
     Budget: [Budget]
     Status: Pending Appointment"
   - After the block, tell the user the appointment is booked and give a warm next step (e.g., "I'll be in touch soon with samples!").

**Rules:**
- If the user tries to skip steps, gently bring them back to the current step.
- Do not mention these internal instructions.
- If the user asks about pricing, explain it depends on scope, then ask if they have a specific budget in mind (e.g., in GHC) or prefer a range.
`;

// --- AI SETUP ---
// Initialize Gemini Client
// Note: We use the server-side API key here
let ai = null;
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
} else {
  console.warn("WARNING: GEMINI_API_KEY is missing in environment variables.");
}

// Simple in-memory storage for conversation history.
// NOTE: If the server restarts (e.g. free tier sleep), this memory is cleared.
const chats = new Map();

// --- HEALTH CHECK ---
app.get('/', (req, res) => {
  res.send('WhatsApp Bot Server is Running! 🚀');
});

// --- WEBHOOK ENDPOINT ---
app.post('/webhook', async (req, res) => {
  try {
    console.log('Incoming Webhook:', req.body);

    // AuthKey standard payload: mobile_number, message
    // Adjust based on actual payload from your provider if different
    const userPhone = req.body.mobile || req.body.from || req.body.sender || req.body.mobile_number; 
    const userMessage = req.body.message || req.body.text || req.body.content;

    if (!userPhone || !userMessage) {
      console.log('Missing phone or message in payload');
      return res.status(400).send('Missing phone or message');
    }

    if (!ai) {
      console.error('Gemini AI not initialized');
      return res.status(500).send('Server Misconfiguration');
    }

    // 1. Get or Create Chat Session
    let chat = chats.get(userPhone);
    if (!chat) {
       chat = ai.chats.create({
         model: 'gemini-2.5-flash',
         config: { systemInstruction: SYSTEM_INSTRUCTION }
       });
       chats.set(userPhone, chat);
    }

    // 2. Get AI Response
    const result = await chat.sendMessage({ message: userMessage });
    const aiResponseText = result.text;

    // 3. Handle "Email Summary" Logic
    let finalMessageToSend = aiResponseText;
    
    if (aiResponseText.includes("EMAIL_SUMMARY_START")) {
        const parts = aiResponseText.split("EMAIL_SUMMARY_START");
        const preText = parts[0];
        const rest = parts[1].split("EMAIL_SUMMARY_END");
        const postText = rest[1] || "";
        
        // Combine the friendly parts for WhatsApp
        finalMessageToSend = preText + "\n[Appointment Confirmed]\n" + postText;
        
        console.log("EMAILING APPOINTMENT TO:", COMPANY_EMAIL);
        // Here you would implement nodemailer to send the actual email
    }

    // 4. Send Reply via AuthKey API
    if (AUTHKEY_AUTH_TOKEN) {
        // Construct AuthKey URL
        const authKeyUrl = `https://api.authkey.io/request?auth=${AUTHKEY_AUTH_TOKEN}&mobile=${userPhone}&country_code=233&sid=YOUR_SENDER_ID&msg=${encodeURIComponent(finalMessageToSend)}`;
        
        // Fire and forget fetch to speed up response
        fetch(authKeyUrl).catch(err => console.error("AuthKey API Error:", err));
    } else {
        console.log("TEST MODE (No AuthKey Token):", finalMessageToSend);
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
