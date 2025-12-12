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
const COMPANY_EMAIL = 'jabconcept3@gmail.com';

// Email Configuration (SMTP)
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
// Defaults to Gmail service, but can be configured for others if needed
const EMAIL_TRANSPORTER = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

if (!GEMINI_API_KEY) {
    console.warn("⚠️  [Server] WARNING: API_KEY is missing in the environment variables!");
} else {
    console.log(`✅ [Server] API Key found (Length: ${GEMINI_API_KEY.length})`);
}

if (!SMTP_USER || !SMTP_PASS) {
    console.warn("⚠️  [Server] WARNING: SMTP_USER or SMTP_PASS missing. Emails will only be logged to console, not sent.");
}

// System Instruction
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
Our company email is: ${COMPANY_EMAIL}

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
6. **Booking & Email:**
   - If they confirm, tell them you are booking the appointment.
   - **CRITICAL:** You must generate a text block that looks like an email summary.
   - Start this specific block with "EMAIL_SUMMARY_START" and end it with "EMAIL_SUMMARY_END".
   - The content inside should be formatted like:
     "To: ${COMPANY_EMAIL}
     Subject: New Appointment: [Service] - [Name]
     
     Name: [Name]
     Service: [Service]
     Goal: [Goal]
     Budget: [Budget]
     Status: Pending Appointment"
   - After the block, tell the user the appointment is booked and give a warm next step.
`;

// Initialize Gemini
let aiClient = null;
if (GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// --- EMAIL SENDING HELPER ---
async function sendEmail(to, subject, text) {
    console.log(`📧 [Email Request] To: ${to}, Subject: ${subject}`);
    
    if (!SMTP_USER || !SMTP_PASS) {
        console.log(`📝 [Email Simulation] Content:\n${text}\n(Configure SMTP_USER & SMTP_PASS to send real emails)`);
        return { success: true, simulated: true };
    }

    try {
        const info = await EMAIL_TRANSPORTER.sendMail({
            from: `"Digital Hub Bot" <${SMTP_USER}>`,
            to: to,
            subject: subject,
            text: text
        });
        console.log("✅ [Email Sent] Message ID:", info.messageId);
        return { success: true, id: info.messageId };
    } catch (error) {
        console.error("❌ [Email Failed]", error);
        throw error;
    }
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

// Endpoint for Frontend to trigger email
app.post('/send-email', async (req, res) => {
    const { to, subject, text } = req.body;
    try {
        const result = await sendEmail(to || COMPANY_EMAIL, subject || "New Digital Hub Appointment", text);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
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
      model: 'gemini-flash-lite-latest', // Use Lite model for webhook stability
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    const result = await chat.sendMessage({ message: userMessage });
    const botResponse = result.text;
    
    console.log("🤖 AI Response Generated:", botResponse);

    // Check if response contains email summary and trigger email from backend automatically
    if (botResponse.includes('EMAIL_SUMMARY_START') && botResponse.includes('EMAIL_SUMMARY_END')) {
        const parts = botResponse.split('EMAIL_SUMMARY_START');
        const rest = parts[1].split('EMAIL_SUMMARY_END');
        const emailContent = rest[0].trim();
        
        // Extract Subject line if possible
        const subjectMatch = emailContent.match(/Subject: (.*)/);
        const subject = subjectMatch ? subjectMatch[1] : "New Digital Hub Appointment";

        // Send email (fire and forget)
        sendEmail(COMPANY_EMAIL, subject, emailContent).catch(e => console.error("Webhook email trigger failed:", e));
    }

    res.status(200).json({ reply: botResponse });

  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Error processing webhook');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));