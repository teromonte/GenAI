"use client";

import { MessageSquare, Plus, Settings, History } from "lucide-react";
import { motion } from "framer-motion";

export default function Sidebar() {
    return (
        <motion.aside
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            className="w-64 bg-gray-900 text-white flex flex-col h-screen border-r border-gray-800"
        >
            <div className="p-4">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 flex items-center gap-2 transition-colors">
                    <Plus size={20} />
                    <span className="font-medium">New Chat</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2">
                <div className="text-xs font-semibold text-gray-400 px-2 mb-2 uppercase tracking-wider">
                    Recent
                </div>
                {/* Mock History Items */}
                {[1, 2, 3].map((i) => (
                    <button
                        key={i}
                        className="w-full text-left p-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white flex items-center gap-2 transition-colors text-sm"
                    >
                        <MessageSquare size={16} />
                        <span className="truncate">Previous Conversation {i}</span>
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-gray-800">
                <button className="w-full text-left p-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white flex items-center gap-2 transition-colors text-sm">
                    <Settings size={18} />
                    <span>Settings</span>
                </button>
            </div>
        </motion.aside>
    );
}
