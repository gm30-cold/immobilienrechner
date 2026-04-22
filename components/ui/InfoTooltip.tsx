"use client";

import { useState, useRef, useLayoutEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface InfoTooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export function InfoTooltip({ content, children }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.top, left: r.left + r.width / 2 });
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        tabIndex={0}
        className="inline-flex items-center cursor-help outline-none"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
      >
        {children}
      </button>
      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "fixed",
                  top: pos.top,
                  left: pos.left,
                  transform: "translate(-50%, -100%) translateY(-8px)",
                  zIndex: 9999,
                  pointerEvents: "none",
                }}
                className="w-64 rounded-xl glass-strong p-3 text-xs leading-relaxed text-[var(--fg-secondary)] shadow-2xl"
                role="tooltip"
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
