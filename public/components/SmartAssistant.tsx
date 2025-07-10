
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ICONS } from '../constants';
import Spinner from './Spinner';

interface Message {
    role: 'user' | 'model';
    parts: string;
}

const SmartAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', parts: 'สวัสดีครับ ผมคือน้องสมาร์ท ผู้ช่วย AI ประจำฟาร์ม มีอะไรให้ผมช่วยไหมครับ? ลองถามเกี่ยวกับการเกษตร, การตลาด, หรือการจัดการฟาร์มได้เลยครับ' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const chatEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);
    
     useEffect(() => {
        if (isOpen && !chat) {
             const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
             const systemInstruction = "You are a helpful and friendly AI assistant for 'Agri-Smart Go', a smart farm management application. Your name is 'Nong Smart' (น้องสมาร์ท). Your purpose is to assist users with questions related to modern agriculture, farm management, data analysis for farming, sales strategies for agricultural products, and general business advice for farmers. You must always respond in the Thai language. Be concise, helpful, and use markdown for formatting when appropriate (like lists or tables).";
             const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: systemInstruction,
                },
             });
             setChat(newChat);
        }
    }, [isOpen, chat]);


    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !chat) return;

        const userMessage: Message = { role: 'user', parts: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const result: GenerateContentResponse = await chat.sendMessage({ message: currentInput });
            const modelResponse: Message = { role: 'model', parts: result.text };
            setMessages(prev => [...prev, modelResponse]);
        } catch (e) {
            console.error(e);
            const errorMessage: Message = { role: 'model', parts: 'ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI กรุณาลองใหม่อีกครั้งในภายหลัง' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="no-print fixed bottom-6 right-6 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-110 z-40"
                aria-label="เปิดผู้ช่วยอัจฉริยะ"
                title="ผู้ช่วยอัจฉริยะ"
            >
                {ICONS.AI_ASSISTANT}
            </button>

            <div className={`fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-end sm:items-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                 <div className={`bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full max-w-2xl h-[90vh] sm:h-[80vh] flex flex-col m-0 sm:m-4 transform transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-10'}`} onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center border-b p-4 flex-shrink-0">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                            {ICONS.AI_ASSISTANT}
                            <span>น้องสมาร์ท - ผู้ช่วย AI</span>
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">{ICONS.AI_ASSISTANT}</div>}
                                <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-green-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                    {msg.role === 'model' ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none prose-p:my-2 prose-headings:my-3">
                                            {msg.parts}
                                        </ReactMarkdown>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{msg.parts}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">{ICONS.AI_ASSISTANT}</div>
                                <div className="ml-2 bg-gray-100 rounded-2xl rounded-bl-none p-4">
                                    <Spinner />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="border-t p-2 sm:p-4 bg-gray-50 flex-shrink-0">
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                            <div className="flex items-center space-x-2">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="พิมพ์คำถามของคุณที่นี่..."
                                    rows={1}
                                    className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 resize-none p-2"
                                />
                                <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                </button>
                            </div>
                        </form>
                    </div>
                 </div>
            </div>
        </>
    );
};

export default SmartAssistant;
