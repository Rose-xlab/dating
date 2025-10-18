'use client';

import { useState, useEffect } from 'react';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close the sidebar automatically on navigation
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="relative flex h-screen bg-gray-100 overflow-hidden">
      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0">
        <ChatHistorySidebar />
      </div>

      {/* Mobile sidebar with overlay */}
      <div className={`fixed inset-0 flex z-40 md:hidden transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200">
          <ChatHistorySidebar />
        </div>
        {/* Backdrop */}
        <div 
          className="flex-1 bg-black bg-opacity-50" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden bg-white shadow-sm p-4 border-b border-gray-200 flex items-center">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 flex justify-center">
             <h1 className="text-xl font-semibold text-gray-900">Swipe Safe</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}