"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import type { Case } from "@/types/case";
import { computeCase } from "@/lib/calc";
import { CaseReport } from "./CaseReport";
import { toast } from "sonner";

interface Props {
  caseItem: Case;
}

export function DownloadPdfButton({ caseItem }: Props) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    try {
      setBusy(true);
      const result = computeCase(caseItem, 30);
      const blob = await pdf(<CaseReport caseItem={caseItem} result={result} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safe = caseItem.name.replace(/[^a-z0-9äöüß\s-]/gi, "").replace(/\s+/g, "-");
      a.download = `immobilien-case-${safe}-${new Date().toISOString().slice(0, 10)}.pdf`;
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

  return (
    <button
      onClick={download}
      disabled={busy}
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-[var(--fg-primary)] transition-colors hover:bg-white/[0.06] disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      PDF-Report
    </button>
  );
}
