import React, { useState } from 'react';
import { Message, Sender } from '../types';
import { Check, CheckCheck, MessageCircle, AlertCircle, Copy, ArrowRight } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === Sender.USER;
  const isError = message.sender === Sender.ERROR;
  const isSummary = message.isEmailSummary; // We reuse this flag for Appointment Summary
  const [copied, setCopied] = useState(false);

  // Retrieve business number from storage or default
  const businessNumber = localStorage.getItem('gemini_business_number') || '233541234567'; 

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text)
        .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => console.error("Copy failed", err));
  };

  if (isSummary) {
    // Generate WhatsApp Link
    const whatsappUrl = `https://wa.me/${businessNumber}?text=${encodeURIComponent(message.text)}`;

    return (
      <div className="flex justify-center my-4 animate-fade-in px-4 w-full">
        <div className="bg-white rounded-lg shadow-md border border-green-100 w-full max-w-sm overflow-hidden">
          <div className="bg-[#25D366] text-white p-3 flex items-center gap-2">
            <MessageCircle size={20} />
            <span className="font-bold text-sm">Appointment Ready</span>
          </div>
          
          <div className="p-4 bg-green-50/50">
             <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Confirm Details</div>
             <div className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed border-l-4 border-[#25D366] pl-3 py-1">
                {message.text}
             </div>
          </div>

          <div className="bg-white p-3 border-t border-gray-100 flex flex-col gap-2">
             <a 
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#075E54] hover:bg-[#064c44] text-white py-3 rounded-lg font-semibold text-sm transition-transform active:scale-95 shadow-sm"
            >
                <span>Send to Business WhatsApp</span>
                <ArrowRight size={16} />
            </a>
            
            <button 
                onClick={handleCopy}
                className="text-xs text-gray-400 hover:text-gray-600 font-medium py-1 flex items-center justify-center gap-1"
            >
                {copied ? "Copied to clipboard" : "Copy text only"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] px-4 py-2 rounded-lg shadow-sm text-sm leading-relaxed
          ${isUser 
            ? 'bg-[#dcf8c6] text-gray-900 rounded-tr-none' 
            : isError
              ? 'bg-red-50 text-red-600 border border-red-200 rounded-tl-none'
              : 'bg-white text-gray-900 rounded-tl-none'
          }`}
      >
        <div className="whitespace-pre-wrap flex items-start gap-2">
            {isError && <AlertCircle size={16} className="shrink-0 mt-0.5" />}
            <span>{message.text}</span>
        </div>
        <div className="flex justify-end items-center mt-1 space-x-1">
          <span className={`text-[10px] ${isError ? 'text-red-400' : 'text-gray-500'}`}>
            {formatTime(message.timestamp)}
          </span>
          {isUser && (
            <CheckCheck size={14} className="text-blue-500" />
          )}
        </div>
      </div>
    </div>
  );
};