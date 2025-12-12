// server.js
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (like css, images, or raw source if needed)
app.use(express.static(__dirname));

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
const COMPANY_EMAIL = 'boatengkwm@yahoo.com';

// --- FRONTEND ROUTE ---
// Serves index.html with the API Key injected for the client-side demo
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading index.html:", err);
            return res.status(500).send('Error loading frontend');
        }
        // Inject the API key into the client-side process polyfill
        const injectedHtml = data.replace(
            "API_KEY: ''", 
            `API_KEY: '${GEMINI_API_KEY || ''}'`
        );
        res.send(injectedHtml);
    });
});

// --- BACKEND WEBHOOK (For Real WhatsApp Integration) ---
app.post('/webhook', async (req, res) => {
  try {
    console.log('Incoming Webhook:', req.body);
    // Simple echo/log for now as the main logic is currently client-side in this demo preview
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
