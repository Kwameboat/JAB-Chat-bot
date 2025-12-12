import React, { useState } from 'react';
import { X, Copy, Server, Check, Key } from 'lucide-react';
import { SYSTEM_INSTRUCTION } from '../services/geminiService';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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
            The backend logic handles real WhatsApp webhooks.
          </p>
          
          <div className="space-y-4">
          
            {/* Step 1: API Key */}
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <strong className="text-blue-800 text-sm flex items-center gap-2 mb-2">
                    <Key size={16} /> 1. Get Gemini API Key
                </strong>
                <p className="text-sm text-blue-700 mb-2">
                   You need a Google Gemini API Key for the chatbot to work.
                </p>
                <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white text-xs px-3 py-2 rounded hover:bg-blue-700 transition"
                >
                    Generate Key at Google AI Studio
                </a>
                <div className="mt-2 text-xs text-blue-800">
                    Then add it to Render: <strong>Environment</strong> -> <strong>Add Environment Variable</strong> -> Key: <code>API_KEY</code>
                </div>
            </div>

            {/* Step 2: Webhook */}
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <strong className="text-yellow-800 text-sm flex items-center gap-2 mb-1">
                    <Server size={16} /> 2. Webhook Configuration
                </strong>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                    <li><strong>URL:</strong> <code>https://your-app-url.onrender.com/webhook</code></li>
                    <li><strong>Method:</strong> <code>POST</code></li>
                    <li><strong>Format:</strong> <code>JSON</code></li>
                </ul>
            </div>

            <div className="bg-gray-100 p-4 rounded text-sm text-gray-700">
                Please refer to <strong>server.js</strong> for the full backend implementation used for deployment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};