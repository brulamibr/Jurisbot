"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Briefcase,
  BookOpen,
  Settings,
  UserCircle,
  Smartphone,
  CalendarClock,
  MessageSquareText,
  Megaphone,
  Contact,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/conversations", label: "Conversas", icon: MessageSquare },
  { href: "/contacts", label: "Contatos", icon: Contact },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/processes", label: "Processos", icon: Briefcase },
  { href: "/knowledge", label: "Base de Conhecimento", icon: BookOpen },
  { href: "/quick-messages", label: "Msgs Rápidas", icon: MessageSquareText },
  { href: "/broadcast", label: "Envio em Massa", icon: Megaphone },
  { href: "/scheduled", label: "Agendamentos", icon: CalendarClock },
  { href: "/whatsapp", label: "WhatsApp", icon: Smartphone },
  { href: "/users", label: "Usuários", icon: UserCircle },
  { href: "/settings", label: "Configurações", icon: Settings },
];

interface SidebarNavProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
