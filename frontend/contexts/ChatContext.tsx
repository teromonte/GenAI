"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface HistoryItem {
    id: number;
    question: string;
    answer: string;
    timestamp: string;
}

interface ChatContextType {
    messages: Message[];
    activeHistoryId: number | null;
    refreshTrigger: number;
    loadConversation: (historyItem: HistoryItem) => void;
    startNewChat: () => void;
    addMessage: (message: Message) => void;
    clearMessages: () => void;
    triggerHistoryRefresh: () => void;
    setActiveHistoryId: (id: number | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const loadConversation = (historyItem: HistoryItem) => {
        setMessages([
            { role: "user", content: historyItem.question },
            { role: "assistant", content: historyItem.answer },
        ]);
        setActiveHistoryId(historyItem.id);
    };

    const startNewChat = () => {
        setMessages([]);
        setActiveHistoryId(null);
    };

    const addMessage = (message: Message) => {
        setMessages((prev) => [...prev, message]);
    };

    const clearMessages = () => {
        setMessages([]);
    };

    const triggerHistoryRefresh = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <ChatContext.Provider
            value={{
                messages,
                activeHistoryId,
                refreshTrigger,
                loadConversation,
                startNewChat,
                addMessage,
                clearMessages,
                triggerHistoryRefresh,
                setActiveHistoryId,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChatContext must be used within a ChatProvider");
    }
    return context;
}
