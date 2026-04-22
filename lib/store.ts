"use client";

import type { Case } from "@/types/case";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CasesState {
  cases: Case[];
  addCase: (c: Case) => void;
  updateCase: (id: string, patch: Partial<Case>) => void;
  /** Immer-ähnliches Update via strukturiertes Klonen. Draft darf mutiert werden. */
  mutateCase: (id: string, fn: (draft: Case) => void) => void;
  removeCase: (id: string) => void;
  getCase: (id: string) => Case | undefined;
  importJSON: (data: Case | Case[]) => number;
}

export const useCasesStore = create<CasesState>()(
  persist(
    (set, get) => ({
      cases: [],
      addCase: (c) =>
        set((s) => ({ cases: [...s.cases, c] })),
      updateCase: (id, patch) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
          ),
        })),
      mutateCase: (id, fn) =>
        set((s) => ({
          cases: s.cases.map((c) => {
            if (c.id !== id) return c;
            const draft = structuredClone(c);
            fn(draft);
            draft.updatedAt = new Date().toISOString();
            return draft;
          }),
        })),
      removeCase: (id) =>
        set((s) => ({ cases: s.cases.filter((c) => c.id !== id) })),
      getCase: (id) => get().cases.find((c) => c.id === id),
      importJSON: (data) => {
        const incoming = Array.isArray(data) ? data : [data];
        set((s) => ({ cases: [...s.cases, ...incoming] }));
        return incoming.length;
      },
    }),
    {
      name: "immobilienrechner:cases",
      version: 1,
    },
  ),
);
