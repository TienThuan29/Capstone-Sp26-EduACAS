import Sidebar from "@/components/sidebar"
import ProtectedPageWrapper from "@/components/protected-page-wrapper"
import type React from "react"

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {    
  return (
    <ProtectedPageWrapper>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto bg-gray-50 dark:bg-gray-900">{children}</main>
      </div>
    </ProtectedPageWrapper>
  )
}