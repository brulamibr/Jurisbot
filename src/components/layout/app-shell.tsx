"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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

  const sidebarHeader = (
    <div className="flex h-14 items-center gap-2 border-b px-4">
      <Scale className="h-5 w-5 text-primary" />
      <span className="text-lg font-semibold">JurisBot</span>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          {sidebarHeader}
          <SidebarNav onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:block">
        {sidebarHeader}
        <SidebarNav />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          officeName={officeName}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
