import React, { useState } from 'react';
import { X, Server, CheckCheck, Key, Save, CreditCard, Zap, Gauge, MessageCircle } from 'lucide-react';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const [manualKey, setManualKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [businessNumber, setBusinessNumber] = useState(localStorage.getItem('gemini_business_number') || '');
  
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

    if (businessNumber.trim()) {
        localStorage.setItem('gemini_business_number', businessNumber.trim().replace(/\+/g, ''));
    } else {
        localStorage.removeItem('gemini_business_number');
    }
    
    localStorage.setItem('gemini_use_lite', String(useLite));

    setShowSuccess(true);
    setTimeout(() => {
        setShowSuccess(false);
        window.location.reload(); 
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
                    <Zap size={16} /> Gemini API Config
                </strong>
                <p className="text-xs text-orange-800 mb-2">
                    Get a free API Key from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline font-bold">Google AI Studio</a>.
                </p>
            </div>
          
            {/* Step 1: API Key */}
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <strong className="text-blue-800 text-sm flex items-center gap-2 mb-2">
                    <Key size={16} /> 1. AI API Key (Required)
                </strong>
                
                <div className="flex gap-2 mb-3">
                    <input 
                        type="password" 
                        value={manualKey}
                        onChange={(e) => setManualKey(e.target.value)}
                        placeholder="Paste your AIza... key here"
                        className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

             {/* Step 2: Business WhatsApp Number */}
             <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <strong className="text-green-800 text-sm flex items-center gap-2 mb-2">
                    <MessageCircle size={16} /> 2. Business WhatsApp Number
                </strong>
                <p className="text-xs text-green-700 mb-2">
                    Where should appointment confirmations be sent? (Enter format like 233555XXXXXX)
                </p>
                <div className="flex gap-2 mb-3">
                    <input 
                        type="text" 
                        value={businessNumber}
                        onChange={(e) => setBusinessNumber(e.target.value)}
                        placeholder="e.g. 233541234567"
                        className="flex-1 px-3 py-2 text-sm border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
            </div>

            {/* Model & Save */}
            <div className="flex flex-col gap-4">
                 {/* Lite Model Toggle */}
                <div className="flex items-start gap-3 bg-white p-3 rounded border border-gray-200">
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
                    </label>
                </div>

                <button 
                    onClick={handleSave}
                    className="w-full bg-[#075E54] text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-[#064c44] transition flex items-center justify-center gap-2"
                >
                    {showSuccess ? <CheckCheck size={18}/> : <Save size={18}/>}
                    {showSuccess ? "Settings Saved!" : "Save Settings"}
                </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};