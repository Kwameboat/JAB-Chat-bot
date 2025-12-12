// server.js
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!GEMINI_API_KEY) {
    console.warn("⚠️  [Server] WARNING: API_KEY is missing in the environment variables!");
} else {
    console.log(`✅ [Server] API Key found (Length: ${GEMINI_API_KEY.length})`);
}

const SERVICES_LIST = [
  "Website Design",
  "Company Management Systems",
  "WhatsApp Chatbots",
  "Social Media Marketing",
  "Graphic Design",
  "Branding",
  "General Digital Solutions"
];

const SYSTEM_INSTRUCTION = `
You are a friendly, professional, and warm Digital Consultant for a "Digital Hub" company.
Your goal is to guide a potential client from a Facebook Ad click to a booked appointment via a conversation.

**Your Personality:**
- Warm, welcoming, and conversational.
- Not robotic. Use emojis occasionally (👋, ✨, 🚀).
- Do not overwhelm the user with long paragraphs. Keep messages concise (under 3-4 sentences usually).
- Guide the user one step at a time.

**The Process (Follow this strictly):**
1. **Welcome & Name:** Warmly welcome them (assume they came from an ad). Ask for their name.
2. **Service Selection:** Once they give their name, ask what they are looking for. Present the services naturally: ${SERVICES_LIST.join(", ")}.
3. **Goal/Problem:** When they pick a service, ask a specific follow-up about their goal or the problem they want to solve.
4. **Budget:** Gently ask about their budget. Invite them to share a specific amount or a range (Low, Medium, Premium).
5. **Confirmation:** Summarize their Name, Service, Goal, and Budget. Ask them to confirm.
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
`;

// Initialize Gemini
let aiClient = null;
if (GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// --- ROUTES ---

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading index.html:", err);
            return res.status(500).send('Error loading frontend');
        }
        const keyToInject = GEMINI_API_KEY || '';
        const injectedHtml = data.replace('__GENAI_API_KEY__', keyToInject);
        res.send(injectedHtml);
    });
});

// Endpoint kept for backward compatibility if needed, but UI now prefers WhatsApp link
app.post('/send-email', async (req, res) => {
    res.json({ success: true, simulated: true, message: "Email endpoint deprecated in favor of WhatsApp redirection." });
});

// Backend Webhook for WhatsApp
app.post('/webhook', async (req, res) => {
  try {
    console.log('Incoming Webhook Body:', JSON.stringify(req.body, null, 2));

    const userMessage = req.body.message || req.body.text || (req.body.entry && req.body.entry[0].changes[0].value.messages[0].text.body);

    if (!userMessage) {
       console.log("No text message found in webhook payload.");
       return res.status(200).send('No message processed');
    }

    if (!aiClient) {
       console.error("Gemini API Key missing on server.");
       return res.status(500).send('Server Config Error: API Key Missing');
    }

    const chat = aiClient.chats.create({
      model: 'gemini-flash-lite-latest', 
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    const result = await chat.sendMessage({ message: userMessage });
    const botResponse = result.text;
    
    console.log("🤖 AI Response Generated:", botResponse);

    res.status(200).json({ reply: botResponse });

  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Error processing webhook');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));