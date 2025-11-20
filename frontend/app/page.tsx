import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";

export default function Home() {
  return (
    <main className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar />
      <ChatArea />
    </main>
  );
}
