"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCasesStore } from "@/lib/store";
import { makeDefaultCase } from "@/lib/defaultCase";
import { cn, formatCurrency } from "@/lib/cn";
import { Building2, Plus, Home, LineChart, Map, Download, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const cases = useCasesStore((s) => s.cases);
  const addCase = useCasesStore((s) => s.addCase);
  const importJSON = useCasesStore((s) => s.importJSON);
  const fileInput = useRef<HTMLInputElement>(null);

  const createCase = () => {
    const c = makeDefaultCase(`Case ${cases.length + 1}`);
    addCase(c);
    router.push(`/cases/${c.id}`);
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(cases, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `immobilienrechner-cases-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${cases.length} Case${cases.length === 1 ? "" : "s"} exportiert`);
  };

  const triggerImport = () => fileInput.current?.click();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const count = importJSON(data);
      toast.success(`${count} Case${count === 1 ? "" : "s"} importiert`);
    } catch (err) {
      toast.error("Import fehlgeschlagen — ungültige JSON-Datei");
    }
    e.target.value = "";
  };

  const navItems = [
    { href: "/", label: "Übersicht", icon: Home },
    { href: "/compare", label: "Vergleich", icon: LineChart, badge: "2" },
    { href: "/benchmark", label: "Markt", icon: Map, badge: "soon" },
  ];

  return (
    <aside className="sticky top-0 z-20 flex h-screen w-64 flex-col border-r border-[var(--border-subtle)] glass">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/30 to-sky-400/20 ring-1 ring-white/10">
          <Building2 className="size-4 text-[var(--accent-emerald)]" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">Immobilien</span>
          <span className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
            Rechner
          </span>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white/[0.06] text-[var(--fg-primary)] ring-1 ring-inset ring-white/10"
                  : "text-[var(--fg-secondary)] hover:bg-white/[0.03] hover:text-[var(--fg-primary)]",
              )}
            >
              <Icon className="size-4" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-[var(--fg-muted)]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-5 pb-2 text-[10px] font-medium uppercase tracking-widest text-[var(--fg-muted)]">
        Cases
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {cases.length === 0 ? (
          <p className="px-3 py-2 text-xs text-[var(--fg-muted)]">
            Noch kein Case angelegt.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {cases.map((c) => {
              const active = pathname.startsWith(`/cases/${c.id}`);
              return (
                <li key={c.id}>
                  <Link
                    href={`/cases/${c.id}`}
                    className={cn(
                      "group flex flex-col gap-0.5 rounded-lg px-3 py-2 transition-colors",
                      active
                        ? "bg-white/[0.06] ring-1 ring-inset ring-white/10"
                        : "hover:bg-white/[0.03]",
                    )}
                  >
                    <span className="truncate text-sm">{c.name}</span>
                    <span className="font-mono text-[10px] text-[var(--fg-muted)]">
                      {formatCurrency(c.kaufkosten.kaufpreis)} ·{" "}
                      {c.stammdaten.adresse.bundesland}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-[var(--border-subtle)] p-3">
        <button
          onClick={createCase}
          className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-emerald-500/80 to-emerald-600/80 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/10 transition-transform hover:-translate-y-0.5 hover:from-emerald-500 hover:to-emerald-600"
        >
          <Plus className="size-4" />
          Neuer Case
        </button>
        <div className="flex gap-2">
          <button
            onClick={triggerImport}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1.5 text-xs text-[var(--fg-secondary)] hover:bg-white/[0.05]"
            title="JSON importieren"
          >
            <Upload className="size-3" /> Import
          </button>
          <button
            onClick={exportAll}
            disabled={cases.length === 0}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1.5 text-xs text-[var(--fg-secondary)] hover:bg-white/[0.05] disabled:opacity-40"
            title="Alle Cases exportieren"
          >
            <Download className="size-3" /> Export
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImport}
        />
      </div>
    </aside>
  );
}
