
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useState } from "react";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <Navbar onOpenSidebar={() => {}} />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="w-full px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
