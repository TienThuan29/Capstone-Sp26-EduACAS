'use client'

import { ReactNode } from 'react'
import { useFirstLoginProtection } from '@/hooks/useFirstLoginProtection'

export default function ProtectedPageWrapper({ children }: { children: ReactNode }) {
  const { isProtected, isLoading } = useFirstLoginProtection()

  // While loading or not protected, don't render anything to avoid layout shift
  if (isLoading || !isProtected) {
    return null
  }

  return <>{children}</>
}
