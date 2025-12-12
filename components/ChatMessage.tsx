import React from 'react';
import { Message, Sender } from '../types';
import { Check, CheckCheck, Mail, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === Sender.USER;
  const isError = message.sender === Sender.ERROR;
  const isEmail = message.isEmailSummary;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isEmail) {
    let statusColor = 'text-gray-600';
    let statusText = 'Sending Email...';
    
    if (message.emailStatus === 'sent') {
        statusColor = 'text-green-600';
        statusText = 'Email Successfully Sent ✓';
    } else if (message.emailStatus === 'failed') {
        statusColor = 'text-red-600';
        statusText = 'Email Failed ✕';
    } else if (message.emailStatus === 'simulated') {
        statusColor = 'text-orange-600';
        statusText = '⚠ Simulation (Configure SMTP)';
    }

    return (
      <div className="flex justify-center my-4 animate-fade-in px-4 w-full">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 w-full max-w-sm overflow-hidden">
          <div className="bg-teal-600 text-white p-3 flex items-center gap-2">
            <Mail size={18} />
            <span className="font-medium text-sm">System Email Sent</span>
          </div>
          <div className="p-4 text-xs font-mono text-gray-700 whitespace-pre-wrap bg-gray-50">
            {message.text}
          </div>
          <div className={`bg-gray-100 p-2 text-center text-xs font-semibold border-t border-gray-200 ${statusColor}`}>
             {statusText}
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