import React, { useState, useEffect, useRef } from 'react';
import { Send, MoreVertical, Phone, Video, Paperclip, Smile, Link2 } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { sendMessageToGemini, initializeChat } from './services/geminiService';
import { ConnectModal } from './components/ConnectModal';
import { Message, Sender } from './types';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState<string>(''); 
  const [hasStarted, setHasStarted] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const isApiKeyMissing = !process.env.API_KEY || process.env.API_KEY === '__GENAI_API_KEY__';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, typingStatus]);

  useEffect(() => {
    initializeChat();
    
    if (isApiKeyMissing) {
        setIsConnectModalOpen(true);
    }

    const timer = setTimeout(() => {
        handleInitialWelcome();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleInitialWelcome = async () => {
      setIsTyping(true);
      try {
          const welcomeText = await sendMessageToGemini("Hello, I just clicked your Facebook ad.");
          addBotMessage(welcomeText);
      } catch (e) {
          addBotMessage("Hi there! Welcome to our Digital Hub. I'm here to help you get started. What is your name?");
      } finally {
          setIsTyping(false);
          setHasStarted(true);
      }
  };

  const addBotMessage = (rawText: string) => {
    // UPDATED TAGS for Appointment Summary
    const startTag = "APPOINTMENT_SUMMARY_START";
    const endTag = "APPOINTMENT_SUMMARY_END";
    
    let processedMessages: Message[] = [];
    
    if (rawText.includes(startTag) && rawText.includes(endTag)) {
        const parts = rawText.split(startTag);
        const preText = parts[0].trim();
        const rest = parts[1].split(endTag);
        const summaryContent = rest[0].trim();
        const postText = rest[1]?.trim();

        if (preText) {
            processedMessages.push({
                id: Date.now().toString() + '-pre',
                text: preText,
                sender: Sender.BOT,
                timestamp: new Date()
            });
        }

        // Add Summary Card (We repurpose isEmailSummary flag for the UI)
        processedMessages.push({
            id: Date.now().toString() + '-summary',
            text: summaryContent,
            sender: Sender.BOT,
            timestamp: new Date(),
            isEmailSummary: true, // This triggers the WhatsApp card in ChatMessage
            emailStatus: 'sent'   // No longer used, but keeps TS happy if strict
        });

        if (postText) {
            processedMessages.push({
                id: Date.now().toString() + '-post',
                text: postText,
                sender: Sender.BOT,
                timestamp: new Date()
            });
        }
    } else {
        processedMessages.push({
            id: Date.now().toString(),
            text: rawText,
            sender: Sender.BOT,
            timestamp: new Date()
        });
    }

    processedMessages.forEach((msg, index) => {
        setTimeout(() => {
            setMessages(prev => [...prev, msg]);
        }, index * 500); 
    });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: Sender.USER,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setTypingStatus(''); 

    try {
      const response = await sendMessageToGemini(inputText, (status) => {
        setTypingStatus(status);
      });
      
      setIsTyping(false);
      setTypingStatus('');
      addBotMessage(response);
    } catch (error: any) {
      setIsTyping(false);
      setTypingStatus('');
      
      let errorMessage = "Connection error. Please try again.";
      const errorStr = error.toString();
      
      if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) {
         errorMessage = "⚠️ High Traffic: Maximum retries exceeded. Please try again in 1 minute.";
      } else {
         try {
            const match = errorStr.match(/{.*}/);
            if (match) {
                const errObj = JSON.parse(match[0]);
                if (errObj.error && errObj.error.message) {
                    errorMessage = `Error: ${errObj.error.message}`;
                }
            }
         } catch(e) {}
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: errorMessage,
        sender: Sender.ERROR,
        timestamp: new Date()
      }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      
      <ConnectModal 
        isOpen={isConnectModalOpen} 
        onClose={() => setIsConnectModalOpen(false)} 
      />

      <div className="w-full h-screen sm:h-[85vh] sm:w-[400px] bg-[#e5ddd5] sm:rounded-[30px] shadow-2xl overflow-hidden flex flex-col relative border border-gray-300">
        
        <div className="bg-[#075E54] p-3 text-white flex items-center justify-between z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
                <img src="https://picsum.photos/200/200" alt="Consultant" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base leading-tight">Digital Hub Consultant</span>
              <span className="text-xs text-gray-200">Online</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white/90">
             <button 
               onClick={() => setIsConnectModalOpen(true)}
               className={`hover:bg-white/10 p-1.5 rounded-full transition-colors flex items-center gap-1 ${isApiKeyMissing ? 'bg-white/20 animate-pulse text-yellow-300' : ''}`}
               title="Settings"
             >
                <Link2 size={20} />
                {isApiKeyMissing && <span className="text-[10px] font-bold">SETUP</span>}
             </button>
            <MoreVertical size={20} className="cursor-pointer hover:text-white" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-whatsapp-pattern relative">
          
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <div className="flex w-full mb-3 justify-start animate-fade-in">
               <div className="flex flex-col gap-1">
                 <div className="bg-white px-4 py-3 rounded-lg rounded-tl-none shadow-sm flex gap-1 items-center w-fit">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                 </div>
                 {typingStatus && (
                     <span className="text-[10px] text-gray-500 font-medium ml-1 bg-white/50 px-2 py-1 rounded w-fit">{typingStatus}</span>
                 )}
               </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-[#F0F0F0] p-2 flex items-center gap-2 shrink-0">
          <div className="flex-1 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message"
              className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm"
              disabled={!hasStarted}
            />
          </div>

          <button 
            onClick={handleSendMessage}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                inputText.trim() ? 'bg-[#075E54] text-white hover:bg-[#064c44]' : 'bg-gray-300 text-gray-500'
            }`}
            disabled={!inputText.trim()}
          >
            <Send size={18} className={inputText.trim() ? 'ml-1' : ''} />
          </button>
        </div>
        
        <div className="h-1 bg-[#F0F0F0] w-full"></div>
      </div>
    </div>
  );
}

export default App;