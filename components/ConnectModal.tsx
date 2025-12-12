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

  // We display the content of server.js for reference
  
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
            The server code has been moved to <strong>server.js</strong> to prevent errors in the browser.
          </p>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-gray-800">Install Dependencies</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ensure your <code>package.json</code> includes these packages:
                </p>
                <div className="bg-gray-100 p-2 rounded mt-2 text-xs font-mono border border-gray-300">
                  npm install express @google/genai node-fetch
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">2</div>
              <div className="w-full">
                <h3 className="font-semibold text-gray-800">Deploy to Render.com</h3>
                
                {/* Render Instructions */}
                <div className="mt-3 bg-green-50 p-4 rounded-lg border border-green-200 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">💡</div>
                    <div>
                      <strong className="text-green-800 block mb-2">Select "Web Service" on Render</strong>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        <div className="bg-white p-2 rounded border border-green-200">
                          <span className="text-xs text-gray-500 block">Build Command</span>
                          <code className="text-sm font-mono font-bold text-gray-800">npm install</code>
                        </div>
                        <div className="bg-white p-2 rounded border border-green-200">
                          <span className="text-xs text-gray-500 block">Start Command</span>
                          <code className="text-sm font-mono font-bold text-red-600">node server.js</code>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                         <strong>Important:</strong> We changed the filename to <code>server.js</code> to fix the "require not defined" error.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <h3 className="font-semibold text-gray-800">Set Webhook URL</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Once deployed, copy your Render URL.
                  <br/>
                  Go to <a href="https://console.authkey.io/dashboard/configure-webhook" target="_blank" rel="noreferrer" className="text-teal-600 underline">AuthKey Webhook Settings</a> and paste it as:
                  <br/>
                  <code>https://your-app.onrender.com/webhook</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t text-center text-xs text-gray-500">
          This server will listen for real WhatsApp messages and reply using the Gemini AI logic.
        </div>

      </div>
    </div>
  );
};