"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDevMemory } from "@/context/dev-memory-context";
import {
  LayoutDashboard,
  GitPullRequest,
  Database,
  Brain,
  Activity,
  Zap,
} from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);


export const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { stats } = useDevMemory();

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      description: "Code ingestion & stats",
    },
    {
      name: "Review with Memory",
      href: "/review",
      icon: GitPullRequest,
      description: "Run AI code review",
    },
    {
      name: "Memory Dashboard",
      href: "/memory",
      icon: Database,
      description: "Manage memory nodes",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-[#00ff88]/30 selection:text-[#00ff88]">
      {/* Sidebar */}
      <aside className="w-80 border-r border-[#1a1a1a] bg-[#070707] flex flex-col justify-between fixed h-screen z-10">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-[#111] border border-[#222]">
              <Brain className="w-6 h-6 text-[#00ff88]" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#00ff88] rounded-full animate-ping" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#00ff88] rounded-full" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">
                Dev<span className="text-[#00ff88]">Memory</span>
              </span>
              {/* Memory Active Badge */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse shadow-[0_0_8px_#00ff88]" />
                <span className="text-[10px] text-[#00ff88] font-mono tracking-widest uppercase font-semibold">
                  Memory Active
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase font-semibold px-3 block mb-3">
              Navigation
            </span>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-lg border transition-all duration-300 group ${
                    isActive
                      ? "bg-[#141414] border-[#00ff88]/40 text-[#00ff88] shadow-[0_0_15px_-3px_rgba(0,255,136,0.1)]"
                      : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#111] hover:border-[#222]"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? "text-[#00ff88]" : "text-gray-400 group-hover:text-gray-300"
                    }`}
                  />
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${isActive ? "text-white" : ""}`}>
                      {item.name}
                    </span>
                    <span className="text-[11px] text-gray-500 font-normal leading-tight mt-0.5">
                      {item.description}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section Widget */}
        <div className="p-6 border-t border-[#1a1a1a] bg-[#050505]">
          <div className="bg-[#111] border border-[#1a1a1a] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-gray-400 font-mono tracking-wider font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#00ff88]" />
                MEMORY INTEGRITY
              </span>
              <span className="text-xs text-[#00ff88] font-mono font-bold">
                {stats.memoryHealth}%
              </span>
            </div>
            <div className="w-full bg-[#222] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#00ff88] to-[#00b3ff] h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.memoryHealth}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-2 font-mono leading-relaxed">
              Synthesized memory nodes are stable. Vector space mapping operating within normal tolerance limits.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-gray-500 font-mono">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              v1.0.0
            </span>
            <span className="hover:text-gray-300 transition-colors cursor-pointer flex items-center gap-1">
              <GithubIcon className="w-3.5 h-3.5" />
              Docs
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pl-80 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};
