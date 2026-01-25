import ProtectedPageWrapper from "@/components/ProtectedPageWrapper"
import type React from "react"

export default function TestAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {    
  return (
    <ProtectedPageWrapper>
      {children}
    </ProtectedPageWrapper>
  )
}
