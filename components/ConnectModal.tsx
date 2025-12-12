import React, { useState } from 'react';
import { X, Copy, Server, Check } from 'lucide-react';
import { SYSTEM_INSTRUCTION } from '../services/geminiService';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // This is the Node.js code the user needs to deploy
  const SERVER_CODE = `
// index.js
// ------------------------------------------------------------------
// BEST FREE HOSTING OPTION: Render.com (Select "Web Service")
// ------------------------------------------------------------------
// Note: This bot stores conversation history in the server's memory.
// Serverless platforms (like Netlify/Vercel) will RESET memory 
// on every message, making the bot forget the user's name immediately.
//
// Dependencies: npm install express @google/genai node-fetch body-parser

const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURATION ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const AUTHKEY_AUTH_TOKEN = process.env.AUTHKEY_AUTH_TOKEN; // Get from AuthKey Dashboard
const COMPANY_EMAIL = 'boatengkwm@yahoo.com';

// --- AI SETUP ---
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const SYSTEM_INSTRUCTION = \`${SYSTEM_INSTRUCTION.replace(/`/g, '\\`')}\`;

// Simple in-memory storage for conversation history.
// NOTE: If the server restarts, this memory is cleared.
const chats = new Map();

// --- HEALTH CHECK ---
app.get('/', (req, res) => {
  res.send('WhatsApp Bot Server is Running! 🚀');
});

// --- WEBHOOK ENDPOINT (Connect this to AuthKey) ---
app.post('/webhook', async (req, res) => {
  try {
    console.log('Incoming Webhook:', req.body);

    // ADAPT THIS: Check AuthKey docs for exact payload structure for incoming messages
    // Usually it's req.body.mobile_number and req.body.message
    const userPhone = req.body.mobile || req.body.from || req.body.sender; 
    const userMessage = req.body.message || req.body.text || req.body.content;

    if (!userPhone || !userMessage) {
      return res.status(400).send('Missing phone or message');
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

    // 3. Handle "Email Summary" Logic (internal processing)
    // We strip the internal email tags before sending to WhatsApp
    let finalMessageToSend = aiResponseText;
    
    if (aiResponseText.includes("EMAIL_SUMMARY_START")) {
        // Parse out the email for your backend to actually send via SMTP if desired
        // For now, we just clean the message for the user
        const parts = aiResponseText.split("EMAIL_SUMMARY_START");
        const preText = parts[0];
        const rest = parts[1].split("EMAIL_SUMMARY_END");
        const postText = rest[1] || "";
        
        // Combine the friendly parts for WhatsApp
        finalMessageToSend = preText + "\\n[Appointment Confirmed]\\n" + postText;
        
        // TODO: Add actual email sending logic here using nodemailer
        console.log("SENDING EMAIL TO:", COMPANY_EMAIL);
    }

    // 4. Send Reply via AuthKey API
    // Check AuthKey docs for "Send Message" endpoint
    const authKeyUrl = \`https://api.authkey.io/request?auth=\${AUTHKEY_AUTH_TOKEN}&mobile=\${userPhone}&country_code=233&sid=YOUR_SENDER_ID&msg=\${encodeURIComponent(finalMessageToSend)}\`;
    
    await fetch(authKeyUrl);

    res.status(200).send('OK');

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(SERVER_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#075E54] p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-2">
            <Server size={20} />
            <h2 className="text-lg font-semibold">Connect to AuthKey & WhatsApp</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <p className="text-gray-600 mb-6 text-sm">
            This simulator runs in your browser. To connect this AI to real WhatsApp users (via AuthKey), 
            you need to deploy a small server that listens for messages.
          </p>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-gray-800">Get AuthKey Credentials</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Log in to <a href="https://console.authkey.io" target="_blank" rel="noreferrer" className="text-teal-600 underline">AuthKey Dashboard</a>. 
                  Get your <strong>Auth Token</strong> and <strong>Sender ID</strong>.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">2</div>
              <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">Deploy this Webhook Server</h3>
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-800 transition"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <div className="relative group">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto h-64 border border-gray-700">
                    {SERVER_CODE}
                  </pre>
                </div>
                <p className="text-xs text-gray-500 mt-2 bg-green-50 p-3 rounded border border-green-200">
                  <strong>💡 Recommendation:</strong> Use <a href="https://render.com" target="_blank" className="underline font-bold text-green-700">Render.com</a> for hosting. 
                  <ul className="list-disc ml-4 mt-1">
                    <li>Create a "Web Service"</li>
                    <li>Connect your GitHub repo</li>
                    <li>It has a <strong>Free Tier</strong> that works perfectly for this bot!</li>
                    <li>Do NOT use Netlify or Vercel (they will forget the conversation context).</li>
                  </ul>
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <h3 className="font-semibold text-gray-800">Set Webhook URL</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Go to <a href="https://console.authkey.io/dashboard/configure-webhook" target="_blank" rel="noreferrer" className="text-teal-600 underline">Configure Webhook</a> in AuthKey. 
                  Paste your server URL (e.g., <code>https://your-app.onrender.com/webhook</code>).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t text-center text-xs text-gray-500">
          Once connected, Facebook Ads clicking to WhatsApp will trigger this conversation flow automatically.
        </div>

      </div>
    </div>
  );
};