"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type SidebarContextType = {
  isExpanded: boolean;
  setExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setExpandedState] = useState(true);
  const setExpanded = useCallback((expanded: boolean) => setExpandedState(expanded), []);
  const toggleExpanded = useCallback(() => setExpandedState((prev) => !prev), []);

  return (
    <SidebarContext.Provider value={{ isExpanded, setExpanded, toggleExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
