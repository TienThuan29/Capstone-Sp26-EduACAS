"use client"

import { createContext, useContext, useEffect, useState } from "react"

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme")
    const htmlElement = document.documentElement
    
    // Prevent transition on initial load
    htmlElement.classList.add("no-transition")
    
    if (savedTheme === "dark") {
      htmlElement.classList.add("dark")
      setIsDark(true)
    } else if (savedTheme === "light") {
      htmlElement.classList.remove("dark")
      setIsDark(false)
    } else {
      // Use system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (prefersDark) {
        htmlElement.classList.add("dark")
      } else {
        htmlElement.classList.remove("dark")
      }
      setIsDark(prefersDark)
    }
    
    // Remove no-transition class after a brief delay to enable smooth transitions
    setTimeout(() => {
      htmlElement.classList.remove("no-transition")
      setMounted(true)
    }, 50)
  }, [])

  const toggleTheme = () => {
    const htmlElement = document.documentElement
    const newIsDark = !isDark
    
    if (newIsDark) {
      htmlElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      htmlElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
    
    setIsDark(newIsDark)
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider")
  }
  return context
}

