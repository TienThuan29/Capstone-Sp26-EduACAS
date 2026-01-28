import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PageUrl } from '@/configs/page.url'

/**
 * Hook để bảo vệ các page thường (chỉ cho phép khi firstLogin = false)
 * Sử dụng: const { isProtected } = useFirstLoginProtection()
 */
export function useFirstLoginProtection() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      // Not logged in, redirect to login
      router.push(PageUrl.LOGIN_PAGE)
      return
    }

    // If user is on first login, redirect to first-login page
    if (user.firstLogin === true) {
      router.push(PageUrl.FIRST_LOGIN_PAGE)
      return
    }
  }, [user, router])

  return {
    isProtected: user && user.firstLogin === false,
    isLoading: !user,
  }
}

/**
 * Hook để bảo vệ first-login page (chỉ cho phép khi firstLogin = true)
 * Sử dụng: const { canAccess } = useFirstLoginPageProtection()
 */
export function useFirstLoginPageProtection() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      // Not logged in, redirect to login
      router.push(PageUrl.LOGIN_PAGE)
      return
    }

    // If user has already done first login, redirect to main page
    if (user.firstLogin === false) {
      router.push(PageUrl.TEST_AUTH_PAGE)
      return
    }
  }, [user, router])

  return {
    canAccess: user !== null && user.firstLogin === true,
    isLoading: !user,
  }
}
