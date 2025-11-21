"use client";

import { Send, Bot, ArrowUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useChatContext } from "@/contexts/ChatContext";
import { MessageBubble } from "@/components/MessageBubble";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ChatArea() {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();
    const { messages, addMessage, triggerHistoryRefresh, activeHistoryId, setActiveHistoryId } = useChatContext();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";

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
        <div className="flex-1 flex flex-col h-full relative bg-background text-foreground">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
                {displayMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Bot size={24} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">How can I help you today?</h2>
                        <p className="text-muted-foreground max-w-md mb-8">
                            I can help you find the latest news from Brazil and Europe.
                        </p>

                        {/* Suggestions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                            {[
                                "Latest news from Brazil",
                                "What's happening in Europe?",
                                "Technology news today",
                                "Sports updates"
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => setInput(suggestion)}
                                    className="p-4 rounded-xl border border-border hover:bg-muted/50 text-left text-sm transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col max-w-3xl mx-auto w-full">
                        {displayMessages.map((message, index) => (
                            <MessageBubble
                                key={index}
                                role={message.role}
                                content={message.content}
                            />
                        ))}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="w-full max-w-3xl mx-auto p-4 pb-8">
                <div className="relative flex items-end gap-2 bg-muted/50 border border-input rounded-2xl p-3 focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all shadow-sm">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Message NewsBot..."
                        disabled={isLoading}
                        className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-48 py-3 px-2 text-sm scrollbar-thin scrollbar-thumb-muted-foreground/20"
                        rows={1}
                    />
                    <Button
                        size="icon"
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className={cn(
                            "h-8 w-8 rounded-lg mb-1 transition-all",
                            input.trim() ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                        )}
                    >
                        <ArrowUp size={16} />
                    </Button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-xs text-muted-foreground">
                        NewsBot can make mistakes. Check important info.
                    </p>
                </div>
            </div>
        </div>
    );
}
