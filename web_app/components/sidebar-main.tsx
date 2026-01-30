"use client";

import { useSidebar } from "@/contexts/SidebarContext";

export default function SidebarMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded } = useSidebar();

  return (
    <main
      className={`flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-[margin] duration-300 ${
        isExpanded ? "ml-64" : "ml-20"
      }`}
    >
      {children}
    </main>
  );
}
