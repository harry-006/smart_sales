"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  PlusCircle, 
  LayoutDashboard, 
  Settings, 
  Sparkles
} from "lucide-react";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Create Proposal", href: "/proposals/new", icon: PlusCircle },
    { name: "Admin Panel", href: "/admin", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#050508] text-gray-100 overflow-x-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] glow-purple opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] glow-blue opacity-10 pointer-events-none" />

      {/* Sidebar Desktop */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-white/5 bg-[#08080c]/80 backdrop-blur-md">
        {/* Logo Section */}
        <div className="flex h-16 items-center gap-2 border-b border-white/5 px-6">
          <Sparkles className="h-6 w-6 text-violet-500 animate-pulse" />
          <span className="font-sans text-lg font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-violet-400 bg-clip-text text-transparent">
            SmartSales AI
          </span>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-violet-600/15 text-violet-400 border border-violet-500/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-100 border border-transparent"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-violet-400" : "text-gray-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Settings / User Info */}
        <div className="border-t border-white/5 p-4 bg-black/20">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20 font-bold">
              SR
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate text-gray-200">Sales Representative</span>
              <span className="text-xs text-gray-500 truncate">sales@smartsales.com</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex flex-1 flex-col pl-64">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-white/5 px-8 bg-[#08080c]/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-500 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
              Enterprise SaaS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 border border-white/5 px-3.5 py-1.5 rounded-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Ollama: Active / DeepSeek-R1 ready</span>
            </div>
          </div>
        </header>

        {/* Page Inner Container */}
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
