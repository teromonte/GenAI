"use client";

import { Send, Bot, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useChatContext } from "@/contexts/ChatContext";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ChatArea() {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { messages, addMessage, triggerHistoryRefresh, activeHistoryId, setActiveHistoryId } = useChatContext();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput("");

        // Add user message to context
        addMessage({ role: "user", content: userMessage });
        setIsLoading(true);
        setStreamingMessage("");

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
                body: JSON.stringify({ question: userMessage, history_id: activeHistoryId }),
            });

            if (res.status === 401) {
                router.push("/login");
                return;
            }

            if (!res.ok) {
                throw new Error("Failed to get response");
            }

            const newHistoryIdHeader = res.headers.get("X-History-Id");
            if (newHistoryIdHeader) {
                setActiveHistoryId(Number(newHistoryIdHeader));
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let fullResponse = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    fullResponse += chunk;
                    setStreamingMessage(fullResponse);
                }
            }

            // Add complete assistant message to context
            addMessage({ role: "assistant", content: fullResponse });
            setStreamingMessage("");

            // Trigger history refresh in sidebar
            triggerHistoryRefresh();

        } catch (error) {
            console.error("Error:", error);
            const errorMsg = "Sorry, I encountered an error. Please try again.";
            addMessage({ role: "assistant", content: errorMsg });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Combine context messages with streaming message
    const displayMessages = [...messages];
    if (streamingMessage) {
        displayMessages.push({ role: "assistant", content: streamingMessage });
    }

    return (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {displayMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                            >
                                <Bot size={64} className="mx-auto text-blue-400" />
                            </motion.div>
                            <h2 className="text-2xl font-bold text-slate-200">
                                Welcome to NewsBot RAG
                            </h2>
                            <p className="text-slate-400 max-w-md">
                                Ask me anything about recent news from Brazil and Europe.
                                I'll search through the latest articles to give you accurate answers.
                            </p>
                        </div>
                    </div>
                ) : (
                    displayMessages.map((message, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"
                                }`}
                        >
                            {message.role === "assistant" && (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <Bot size={20} className="text-white" />
                                </div>
                            )}
                            <div
                                className={`max-w-3xl rounded-2xl px-6 py-4 ${message.role === "user"
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                    : "bg-slate-800 text-slate-100 border border-slate-700"
                                    }`}
                            >
                                <p className="whitespace-pre-wrap leading-relaxed">
                                    {message.content}
                                </p>
                            </div>
                            {message.role === "user" && (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                    <User size={20} className="text-white" />
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-700 p-6 bg-slate-900/50 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Ask about recent news..."
                                disabled={isLoading}
                                className="w-full px-6 py-4 bg-slate-800 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-100 placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                rows={1}
                                style={{
                                    minHeight: "56px",
                                    maxHeight: "200px",
                                }}
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={sendMessage}
                            disabled={isLoading || !input.trim()}
                            className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            <Send size={20} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}
