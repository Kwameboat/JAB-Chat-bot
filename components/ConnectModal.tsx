import React, { useState } from 'react';
import { X, Copy, Server, Check, Key, Mail, CheckCheck, Save, CreditCard, AlertTriangle, ExternalLink, Zap, Gauge } from 'lucide-react';
import { SYSTEM_INSTRUCTION } from '../services/geminiService';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const [manualKey, setManualKey] = useState(localStorage.getItem('gemini_api_key') || '');
  
  // LOGIC UPDATE: Default to TRUE if not set. 'false' string means explicitly disabled.
  const storedLitePref = localStorage.getItem('gemini_use_lite');
  const initialLiteState = storedLitePref === 'false' ? false : true; 
  
  const [useLite, setUseLite] = useState(initialLiteState);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    if (manualKey.trim()) {
        localStorage.setItem('gemini_api_key', manualKey.trim());
    } else {
        localStorage.removeItem('gemini_api_key');
    }
    
    // Save model preference
    localStorage.setItem('gemini_use_lite', String(useLite));

    setShowSuccess(true);
    setTimeout(() => {
        setShowSuccess(false);
        window.location.reload(); // Reload to pick up new key/settings
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#075E54] p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-2">
            <Server size={20} />
            <h2 className="text-lg font-semibold">Connect & Setup</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          
          <div className="space-y-6">

            {/* ERROR WORKAROUND SECTION */}
            <div className="bg-orange-50 p-4 rounded-md border border-orange-200">
                <strong className="text-orange-800 text-sm flex items-center gap-2 mb-2">
                    <Zap size={16} /> Stuck on Billing Error (OR_BAOOC_03)?
                </strong>
                <p className="text-xs text-orange-800 mb-2">
                    If Google Payments is locking you out, <strong>do not wait</strong>.
                </p>
                <ol className="text-xs text-orange-800 list-decimal list-inside space-y-1 font-medium">
                    <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline font-bold">Google AI Studio</a>.</li>
                    <li>Click the <strong>Project Dropdown</strong> (top left).</li>
                    <li>Select <strong>"New Project"</strong>.</li>
                    <li>Click <strong>"Create API Key"</strong> in this new project.</li>
                    <li>Paste that new key below. It works immediately on the Free Tier!</li>
                </ol>
            </div>
          
            {/* Step 1: API Key */}
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <strong className="text-blue-800 text-sm flex items-center gap-2 mb-2">
                    <Key size={16} /> 1. AI API Key (Gemini)
                </strong>
                <p className="text-xs text-blue-700 mb-3">
                   Paste your API Key here to enable the Chatbot.
                </p>
                
                <div className="flex gap-2 mb-3">
                    <input 
                        type="password" 
                        value={manualKey}
                        onChange={(e) => setManualKey(e.target.value)}
                        placeholder="Paste your AIza... key here"
                        className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                        onClick={handleSave}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition flex items-center gap-1"
                    >
                        {showSuccess ? <CheckCheck size={16}/> : <Save size={16}/>}
                        {showSuccess ? "Saved!" : "Save"}
                    </button>
                </div>

                {/* Lite Model Toggle */}
                <div className="flex items-start gap-3 bg-white p-3 rounded border border-blue-100">
                    <input 
                        type="checkbox" 
                        id="liteModel" 
                        checked={useLite} 
                        onChange={(e) => setUseLite(e.target.checked)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="liteModel" className="cursor-pointer select-none">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                            <Gauge size={16} className="text-purple-600"/> 
                            Use 'Lite' Model (Recommended)
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Highly recommended for Free Tier. Switches to <code>gemini-flash-lite</code> which is faster and prevents "High Traffic" errors.
                        </p>
                    </label>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px]">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-600 underline font-bold flex items-center gap-1 hover:text-blue-800">
                        <Key size={12}/> Get a key here
                    </a>
                    <span className="text-gray-300 hidden sm:inline">|</span>
                    <a href="https://aistudio.google.com/app/plan_information" target="_blank" className="text-purple-600 underline font-bold flex items-center gap-1 hover:text-purple-800">
                        <CreditCard size={12}/> Setup Billing
                    </a>
                </div>
            </div>

            {/* Step 2: Email Setup Info */}
            <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <strong className="text-green-800 text-sm flex items-center gap-2 mb-1">
                    <Mail size={16} /> 2. Email Configuration
                </strong>
                <p className="text-xs text-green-700 mb-2">
                    To receive actual emails, set these in your Render Environment:
                </p>
                <ul className="text-xs text-green-700 list-disc list-inside space-y-1">
                    <li><strong>SMTP_USER:</strong> <code>jabconcept3@gmail.com</code></li>
                    <li><strong>SMTP_PASS:</strong> Your Gmail App Password</li>
                </ul>
            </div>

            {/* Step 3: Webhook Info */}
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 opacity-80">
                <strong className="text-yellow-800 text-sm flex items-center gap-2 mb-1">
                    <Server size={16} /> 3. WhatsApp Webhook
                </strong>
                <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                    <li><strong>URL:</strong> <code>https://your-app-url.onrender.com/webhook</code></li>
                </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};