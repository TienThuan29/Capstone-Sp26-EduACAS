import Sidebar from "@/components/sidebar";
import SidebarMain from "@/components/sidebar-main";
import ProtectedPageWrapper from "@/components/protected-page-wrapper";
import { SidebarProvider } from "@/contexts/SidebarContext";
import type React from "react";

export default function ProblemBanksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedPageWrapper>
      <SidebarProvider>
        <div className="flex h-screen">
          <Sidebar />
          <SidebarMain>{children}</SidebarMain>
        </div>
      </SidebarProvider>
    </ProtectedPageWrapper>
  );
}
