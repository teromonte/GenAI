"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus, LogOut, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useChatContext } from "@/contexts/ChatContext";

interface HistoryItem {
    id: number;
    question: string;
    answer: string;
    timestamp: string;
}

export default function Sidebar() {
    const router = useRouter();
    const { loadConversation, startNewChat, activeHistoryId, refreshTrigger } = useChatContext();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 50;
    const pendingDeletesRef = useRef<Set<number>>(new Set());

    const fetchHistory = async (currentOffset: number = 0, append: boolean = false) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/chat/history?offset=${currentOffset}&limit=${limit}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error(`Failed to fetch history (${res.status})`);
            }
            const data = await res.json();
            const total = res.headers.get("X-Total-Count");

            if (append) {
                setHistory((prev) => [...prev, ...data]);
            } else {
                setHistory(data);
            }

            if (total) {
                setTotalCount(parseInt(total));
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
            toast.error("Failed to load chat history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Listen to refresh trigger from context
    useEffect(() => {
        if (refreshTrigger > 0) {
            fetchHistory(0, false);
        }
    }, [refreshTrigger]);

    const handleNewChat = () => {
        startNewChat();
    };

    const handleLoadConversation = (item: HistoryItem) => {
        loadConversation(item);
    };

    const handleDelete = async (id: number, question: string) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Store original item for undo
        const deletedItem = history.find((item) => item.id === id);
        if (!deletedItem) return;

        // Mark as pending delete
        pendingDeletesRef.current.add(id);

        // Optimistically remove from UI
        setHistory((prev) => prev.filter((item) => item.id !== id));

        // Show toast with undo option
        toast.error(`Deleted: "${question.substring(0, 30)}..."`, {
            duration: 5000,
            action: {
                label: "Undo",
                onClick: () => {
                    // Remove from pending deletes
                    pendingDeletesRef.current.delete(id);
                    // Restore item to history
                    setHistory((prev) => {
                        const newHistory = [...prev, deletedItem];
                        newHistory.sort((a, b) =>
                            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                        );
                        return newHistory;
                    });
                },
            },
        });

        // Wait for toast duration, then actually delete if still pending
        setTimeout(async () => {
            if (pendingDeletesRef.current.has(id)) {
                try {
                    const res = await fetch(`/api/chat/history/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) {
                        throw new Error("Failed to delete");
                    }
                    // Remove from pending on success
                    pendingDeletesRef.current.delete(id);
                } catch (error) {
                    console.error("Failed to delete:", error);
                    toast.error("Failed to delete history item");
                    // Restore on error
                    setHistory((prev) => {
                        const newHistory = [...prev, deletedItem];
                        newHistory.sort((a, b) =>
                            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                        );
                        return newHistory;
                    });
                    // Remove from pending
                    pendingDeletesRef.current.delete(id);
                }
            }
        }, 5000);
    };

    const handleLoadMore = () => {
        const newOffset = offset + limit;
        setOffset(newOffset);
        fetchHistory(newOffset, true);
    };

    const hasMore = history.length < totalCount;

    return (
        <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    NewsBot RAG
                </h1>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNewChat}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg"
                >
                    <Plus size={20} />
                    <span className="font-medium">New Chat</span>
                </motion.button>
            </div>

            {/* History */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2">
                <h2 className="text-sm font-semibold text-slate-400 mb-2">Recent</h2>
                {loading && history.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin text-slate-400" size={24} />
                    </div>
                ) : history.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                        No conversations yet
                    </p>
                ) : (
                    history.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${activeHistoryId === item.id
                                    ? "bg-slate-700 border border-blue-500"
                                    : "hover:bg-slate-700/50"
                                }`}
                        >
                            <MessageSquare size={16} className="text-slate-400 flex-shrink-0" />
                            <span
                                onClick={() => handleLoadConversation(item)}
                                className="text-sm text-slate-300 truncate flex-1"
                            >
                                {item.question}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item.id, item.question);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                            >
                                <Trash2 size={14} className="text-red-400" />
                            </button>
                        </motion.div>
                    ))
                )}

                {/* Load More Button */}
                {hasMore && (
                    <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="w-full py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin mx-auto" size={16} />
                        ) : (
                            "Load More"
                        )}
                    </button>
                )}
            </div>

            {/* Logout */}
            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={() => {
                        localStorage.removeItem("token");
                        router.push("/login");
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                    <LogOut size={18} />
                    <span className="text-sm">Logout</span>
                </button>
            </div>
        </div>
    );
}
