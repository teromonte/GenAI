"use client";

import { Send, Bot, User } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ChatArea() {
    const [input, setInput] = useState("");

    return (
        <div className="flex-1 flex flex-col h-screen bg-gray-950 text-gray-100">
            {/* Header */}
            <header className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur-sm">
                <h1 className="text-lg font-semibold flex items-center gap-2">
                    <Bot className="text-blue-500" />
                    GenAI Assistant
                </h1>
                <div className="text-xs text-gray-500">v1.0.0</div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Mock Welcome Message */}
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
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/30">
                <div className="max-w-3xl mx-auto relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask anything..."
                        className="w-full bg-gray-800 text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-[52px] overflow-hidden"
                        rows={1}
                    />
                    <button
                        className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!input.trim()}
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
