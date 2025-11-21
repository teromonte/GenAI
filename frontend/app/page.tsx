import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";

export default function Home() {
  return (
    <main className="flex h-screen bg-background text-foreground overflow-hidden">
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>
      <ChatArea />
    </main>
  );
}
