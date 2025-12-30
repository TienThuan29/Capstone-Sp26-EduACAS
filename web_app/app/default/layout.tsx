import Sidebar from "@/components/sidebar"
import type React from "react"

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {    
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto bg-gray-50">{children}</main>
    </div>
  )
}