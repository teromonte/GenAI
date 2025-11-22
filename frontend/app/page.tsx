"use client"

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import { FeedManagement } from "@/components/FeedManagement";
import { ArticleGenerator } from "@/components/ArticleGenerator";
import { AuthGuard } from "@/components/AuthGuard";

export default function Home() {
  const [activeView, setActiveView] = useState<'chat' | 'feeds' | 'write'>('chat');

  return (
    <AuthGuard>
      <main className="flex h-screen bg-background text-foreground overflow-hidden">
        <div className="hidden md:flex h-full">
          <Sidebar activeView={activeView} onViewChange={setActiveView} />
        </div>

        <div className="flex-1 h-full overflow-hidden relative">
          {activeView === 'chat' && <ChatArea />}

          {activeView === 'feeds' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <FeedManagement />
              </div>
            </div>
          )}

          {activeView === 'write' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <ArticleGenerator />
              </div>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}


