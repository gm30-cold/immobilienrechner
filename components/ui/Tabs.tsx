"use client";

import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";

export interface TabDef {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabDef[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeId, onChange, className }: TabsProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "relative flex gap-1 rounded-xl glass p-1",
        "overflow-x-auto",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            onMouseEnter={() => setHovered(tab.id)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "relative flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "text-[var(--fg-primary)]"
                : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="active-tab-pill"
                className="absolute inset-0 rounded-lg bg-white/[0.07] ring-1 ring-white/10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            {hovered === tab.id && !isActive && (
              <motion.span
                layoutId="hover-tab-pill"
                className="absolute inset-0 rounded-lg bg-white/[0.03]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
