"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus, LogOut, Loader2, Trash2, MoreHorizontal, LayoutDashboard, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useChatContext } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface HistoryItem {
    id: number;
    question: string;
    answer: string;
    timestamp: string;
}

type GroupedHistory = {
    [key: string]: HistoryItem[];
};

export default function Sidebar() {
    const router = useRouter();
    const { loadConversation, startNewChat, activeHistoryId, refreshTrigger } = useChatContext();
    const { theme, setTheme } = useTheme();
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

        const deletedItem = history.find((item) => item.id === id);
        if (!deletedItem) return;

        pendingDeletesRef.current.add(id);
        setHistory((prev) => prev.filter((item) => item.id !== id));

        toast.error(`Deleted conversation`, {
            duration: 5000,
            action: {
                label: "Undo",
                onClick: () => {
                    pendingDeletesRef.current.delete(id);
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

        setTimeout(async () => {
            if (pendingDeletesRef.current.has(id)) {
                try {
                    await fetch(`/api/chat/history/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    pendingDeletesRef.current.delete(id);
                } catch (error) {
                    console.error("Failed to delete:", error);
                    toast.error("Failed to delete history item");
                    setHistory((prev) => {
                        const newHistory = [...prev, deletedItem];
                        newHistory.sort((a, b) =>
                            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                        );
                        return newHistory;
                    });
                    pendingDeletesRef.current.delete(id);
                }
            }
        }, 5000);
    };

    const groupHistoryByDate = (items: HistoryItem[]): GroupedHistory => {
        const groups: GroupedHistory = {
            "Today": [],
            "Yesterday": [],
            "Previous 7 Days": [],
            "Older": []
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        items.forEach(item => {
            const date = new Date(item.timestamp);
            if (date >= today) {
                groups["Today"].push(item);
            } else if (date >= yesterday) {
                groups["Yesterday"].push(item);
            } else if (date >= lastWeek) {
                groups["Previous 7 Days"].push(item);
            } else {
                groups["Older"].push(item);
            }
        });

        // Remove empty groups
        Object.keys(groups).forEach(key => {
            if (groups[key].length === 0) delete groups[key];
        });

        return groups;
    };

    const groupedHistory = groupHistoryByDate(history);

    return (
        <div className="w-[260px] bg-black flex flex-col h-full border-r border-white/10">
            {/* New Chat Button */}
            <div className="p-3">
                <Button
                    onClick={handleNewChat}
                    variant="outline"
                    className="w-full justify-start gap-2 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white transition-colors h-10"
                >
                    <Plus size={16} />
                    <span>New chat</span>
                </Button>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {loading && history.length === 0 ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-white/50" size={20} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedHistory).map(([label, items]) => (
                            <div key={label}>
                                <h3 className="text-xs font-medium text-white/50 px-3 mb-2">{label}</h3>
                                <div className="space-y-1">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                                                activeHistoryId === item.id
                                                    ? "bg-white/10 text-white"
                                                    : "text-white/80 hover:bg-white/5 hover:text-white"
                                            )}
                                            onClick={() => handleLoadConversation(item)}
                                        >
                                            <span className="truncate flex-1">{item.question}</span>

                                            {/* Delete Action */}
                                            <div className={cn(
                                                "absolute right-2 flex items-center",
                                                activeHistoryId === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                            )}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 hover:bg-white/20 text-white/50 hover:text-white"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(item.id, item.question);
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* User Profile / Bottom Section */}
            <div className="p-3 border-t border-white/10">
                <Popover>
                    <PopoverTrigger asChild>
                        <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group w-full">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-green-600 text-white text-xs">TM</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="text-sm font-medium text-white truncate">Thiago Monteiro</div>
                                <div className="text-xs text-white/50">Pro Plan</div>
                            </div>
                            <MoreHorizontal size={16} className="text-white/50 group-hover:text-white transition-colors" />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-1 bg-[#1e1e1e] border-white/10 text-white" side="top" align="start" sideOffset={10}>
                        <div className="space-y-1">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-white/80 hover:text-white hover:bg-white/10 h-9 px-2 font-normal"
                                onClick={() => toast.info("Settings coming soon!")}
                            >
                                <LayoutDashboard size={16} />
                                <span>Settings</span>
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-white/80 hover:text-white hover:bg-white/10 h-9 px-2 font-normal"
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            >
                                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                            </Button>
                            <div className="h-px bg-white/10 my-1" />
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9 px-2 font-normal"
                                onClick={() => {
                                    localStorage.removeItem("token");
                                    router.push("/login");
                                }}
                            >
                                <LogOut size={16} />
                                <span>Log out</span>
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
