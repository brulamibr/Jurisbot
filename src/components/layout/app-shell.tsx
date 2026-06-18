"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { Header } from "./header";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  officeName?: string;
}

export function AppShell({
  children,
  userName,
  userEmail,
  userRole,
  officeName,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Scale className="h-5 w-5 text-sidebar-primary" />
          <span className="text-lg font-semibold text-sidebar-foreground">
            JurisBot
          </span>
        </div>
        <SidebarNav />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          officeName={officeName}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
