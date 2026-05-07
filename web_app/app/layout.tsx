import { ThemeModeScript } from "flowbite-react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeInit } from "../.flowbite-react/init";
import { ToastProvider } from "@/contexts/ToastContext";
import { UserProvider } from "@/contexts/AuthContext";
import { ActiveExamSessionGate } from "@/components/student-exam-session/active-exam-session-gate";
import { GlobalDisallowedRouteExamGuard } from "@/components/student-exam-session/global-disallowed-route-exam-guard";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/components/theme-provider";
import { LOGO_EDU_ACAS_SINGLE } from "@/assets/images";
import { AcademicWarningToastListener } from "@/components/academic-warning/academic-warning-toast-listener";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Edu ACAS",
  description:
    "Automated Console-based Programming Assessment System for University Education",
  icons: {
    icon: LOGO_EDU_ACAS_SINGLE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeModeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeInit />
        <ToastProvider>
          <UserProvider>
            <AcademicWarningToastListener />
            <ActiveExamSessionGate />
            <GlobalDisallowedRouteExamGuard />
            <SidebarProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </SidebarProvider>
          </UserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
