"use client";

import { Send, Bot, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ChatArea() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        // Add placeholder for assistant message
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const res = await fetch("/api/chat/stream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ question: userMessage }),
            });

            if (res.status === 401) {
                router.push("/login");
                return;
            }

            if (!res.ok || !res.body) {
                throw new Error("Failed to send message");
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let assistantMessage = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: true });
                assistantMessage += chunkValue;

                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === "assistant") {
                        lastMessage.content = assistantMessage;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === "assistant" && lastMessage.content === "") {
                    lastMessage.content = "Sorry, something went wrong. Please try again.";
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex-1 flex flex-col h-screen bg-gray-950 text-gray-100">
            {/* Header */}
            <header className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur-sm">
                <h1 className="text-lg font-semibold flex items-center gap-2">
                    <Bot className="text-blue-500" />
                    GenAI Assistant
                </h1>
                <div className="text-xs text-gray-500">v1.0.2</div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 max-w-3xl mx-auto"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <Bot size={18} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="font-medium text-sm text-blue-400">Assistant</div>
                            <div className="prose prose-invert max-w-none text-gray-300">
                                <p>Hello! I'm your GenAI assistant. How can I help you today?</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 max-w-3xl mx-auto"
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                            {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className={`font-medium text-sm ${msg.role === 'assistant' ? 'text-blue-400' : 'text-gray-400'}`}>
                                {msg.role === 'assistant' ? 'Assistant' : 'You'}
                            </div>
                            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
                                {msg.content}
                            </div>
                        </div>
                    </motion.div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/30">
                <div className="max-w-3xl mx-auto relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything..."
                        className="w-full bg-gray-800 text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-[52px] overflow-hidden"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!input.trim() || isLoading}
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="text-center text-xs text-gray-500 mt-2">
                    AI can make mistakes. Check important info.
                </div>
            </div>
        </div>
    );
}
