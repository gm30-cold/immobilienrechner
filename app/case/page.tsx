"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCasesStore } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, type TabDef } from "@/components/ui/Tabs";
import {
  LayoutDashboard,
  FileText,
  Wallet,
  Hammer,
  Receipt,
  LogOut,
  Target,
  ShoppingCart,
} from "lucide-react";
import { CaseActionButtons } from "@/components/report/CaseActionButtons";
import { DashboardView } from "./views/DashboardView";
import { StammdatenView } from "./views/StammdatenView";
import { KaufkostenView } from "./views/KaufkostenView";
import { FinanzierungView } from "./views/FinanzierungView";
import { BewirtschaftungView } from "./views/BewirtschaftungView";
import { SteuerView } from "./views/SteuerView";
import { SzenarienView } from "./views/SzenarienView";
import { ExitView } from "./views/ExitView";

const tabs: TabDef[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
  { id: "stammdaten", label: "Stammdaten", icon: <FileText className="size-4" /> },
  { id: "kaufkosten", label: "Kaufkosten", icon: <ShoppingCart className="size-4" /> },
  { id: "finanzierung", label: "Finanzierung", icon: <Wallet className="size-4" /> },
  { id: "bewirtschaftung", label: "Bewirtschaftung", icon: <Hammer className="size-4" /> },
  { id: "steuer", label: "Steuer", icon: <Receipt className="size-4" /> },
  { id: "szenarien", label: "Szenarien", icon: <Target className="size-4" /> },
  { id: "exit", label: "Exit", icon: <LogOut className="size-4" /> },
];

export default function CasePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--fg-muted)]">Lade Case …</div>}>
      <CasePageInner />
    </Suspense>
  );
}

function CasePageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const caseItem = useCasesStore((s) => s.cases.find((c) => c.id === id));
  const [active, setActive] = useState("dashboard");

  useEffect(() => {
    if (!id) {
      router.replace("/");
      return;
    }
    if (!caseItem) {
      const t = setTimeout(() => {
        if (!useCasesStore.getState().cases.find((c) => c.id === id)) {
          router.replace("/");
        }
      }, 100);
      return () => clearTimeout(t);
    }
  }, [caseItem, id, router]);

  if (!caseItem) {
    return <div className="p-8 text-sm text-[var(--fg-muted)]">Lade Case …</div>;
  }

  return (
    <div>
      <PageHeader
        title={caseItem.name}
        subtitle={`${caseItem.stammdaten.adresse.ort || "—"} · ${caseItem.stammdaten.adresse.bundesland} · ${caseItem.stammdaten.objekttyp}`}
        actions={<CaseActionButtons caseItem={caseItem} />}
      />

      <div className="px-8 pt-6">
        <Tabs tabs={tabs} activeId={active} onChange={setActive} />
      </div>

      <div className="p-8">
        {active === "dashboard" && <DashboardView caseItem={caseItem} />}
        {active === "stammdaten" && <StammdatenView caseItem={caseItem} />}
        {active === "kaufkosten" && <KaufkostenView caseItem={caseItem} />}
        {active === "finanzierung" && <FinanzierungView caseItem={caseItem} />}
        {active === "bewirtschaftung" && <BewirtschaftungView caseItem={caseItem} />}
        {active === "steuer" && <SteuerView caseItem={caseItem} />}
        {active === "szenarien" && <SzenarienView caseItem={caseItem} />}
        {active === "exit" && <ExitView caseItem={caseItem} />}
      </div>
    </div>
  );
}
