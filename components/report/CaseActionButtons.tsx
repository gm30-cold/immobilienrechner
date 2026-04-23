"use client";

import { useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Copy, Download, FileJson, Loader2, MoreHorizontal, Trash2, Upload } from "lucide-react";
import type { Case } from "@/types/case";
import { computeCase } from "@/lib/calc";
import { CaseReport } from "./CaseReport";
import { useCasesStore } from "@/lib/store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  caseItem: Case;
}

function safeName(name: string) {
  return name.replace(/[^a-z0-9äöüß\s-]/gi, "").replace(/\s+/g, "-");
}

export function CaseActionButtons({ caseItem }: Props) {
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const addCase = useCasesStore((s) => s.addCase);
  const removeCase = useCasesStore((s) => s.removeCase);
  const importJSON = useCasesStore((s) => s.importJSON);
  const router = useRouter();

  const downloadPdf = async () => {
    try {
      setBusy(true);
      const result = computeCase(caseItem, 30);
      const blob = await pdf(<CaseReport caseItem={caseItem} result={result} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `immobilien-case-${safeName(caseItem.name)}-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF-Report erstellt");
    } catch (err) {
      console.error(err);
      toast.error("PDF-Export fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(caseItem, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `case-${safeName(caseItem.name)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Case als JSON exportiert");
    setMenuOpen(false);
  };

  const duplicate = () => {
    const copy: Case = {
      ...structuredClone(caseItem),
      id: crypto.randomUUID(),
      name: `${caseItem.name} (Kopie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addCase(copy);
    toast.success("Case dupliziert");
    setMenuOpen(false);
    router.push(`/cases/${copy.id}`);
  };

  const deleteCase = () => {
    if (!confirm(`"${caseItem.name}" wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) return;
    removeCase(caseItem.id);
    toast.success("Case gelöscht");
    router.push("/");
  };

  const triggerImport = () => importRef.current?.click();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const count = importJSON(data);
      toast.success(`${count} Case${count === 1 ? "" : "s"} importiert`);
    } catch {
      toast.error("Import fehlgeschlagen — ungültige JSON-Datei");
    }
    e.target.value = "";
    setMenuOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={downloadPdf}
        disabled={busy}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-[var(--fg-primary)] transition-colors hover:bg-white/[0.06] disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        PDF-Report
      </button>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-sm text-[var(--fg-primary)] transition-colors hover:bg-white/[0.06]"
          title="Weitere Aktionen"
        >
          <MoreHorizontal className="size-4" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl glass-strong shadow-xl"
              >
                <MenuItem icon={<FileJson className="size-4" />} onClick={downloadJson}>
                  Als JSON exportieren
                </MenuItem>
                <MenuItem icon={<Upload className="size-4" />} onClick={triggerImport}>
                  JSON importieren …
                </MenuItem>
                <MenuItem icon={<Copy className="size-4" />} onClick={duplicate}>
                  Case duplizieren
                </MenuItem>
                <div className="h-px bg-white/5" />
                <MenuItem
                  icon={<Trash2 className="size-4" />}
                  onClick={deleteCase}
                  danger
                >
                  Case löschen
                </MenuItem>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <input
        ref={importRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImport}
      />
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.05]",
        danger ? "text-[var(--accent-rose)]" : "text-[var(--fg-primary)]",
      ].join(" ")}
    >
      <span className={danger ? "text-[var(--accent-rose)]" : "text-[var(--fg-muted)]"}>
        {icon}
      </span>
      {children}
    </button>
  );
}
