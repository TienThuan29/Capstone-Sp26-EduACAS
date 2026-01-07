"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, DarkThemeToggle, Label, TextInput } from "flowbite-react";
import Link from "next/link";
import AuthWallpaper from "@/components/auth-wallpaper";
import FlyingObjectsBackground from "@/components/flying-objects-background";
import { useAuth } from "@/contexts/AuthContext";
import { config } from "@/configs/config";
import { handleGoogleLogin } from "./google-login";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleInitialized = useRef(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredentialResponse = useCallback(async (response: { credential: string }) => {
    try {
      if (!response.credential) {
        console.error("No credential received from Google");
        setIsGoogleLoading(false);
        return;
      }
      
      await loginWithGoogle(response.credential);
    } catch (error) {
      console.error("Google login error:", error);
      setIsGoogleLoading(false);
    }
  }, [loginWithGoogle]);

  useEffect(() => {
    if (!googleInitialized.current && config.GOOGLE_CLIENT_ID) {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        if (window.google && config.GOOGLE_CLIENT_ID) {
          window.google.accounts.id.initialize({
            client_id: config.GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          googleInitialized.current = true;
        }
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && config.GOOGLE_CLIENT_ID) {
          try {
            window.google.accounts.id.initialize({
              client_id: config.GOOGLE_CLIENT_ID,
              callback: handleGoogleCredentialResponse,
              auto_select: false,
              cancel_on_tap_outside: true,
            });
            googleInitialized.current = true;
            console.log("Google Identity Services initialized successfully");
          } catch (error) {
            console.error("Error initializing Google Identity Services:", error);
          }
        }
      };
      script.onerror = () => {
        console.error("Failed to load Google Identity Services script");
      };
      document.body.appendChild(script);

      return () => {
        // Cleanup if needed
      };
    } else if (!config.GOOGLE_CLIENT_ID) {
      console.warn("Google Client ID is not configured");
    }
  }, [handleGoogleCredentialResponse]);

  const onGoogleLogin = () => {
    handleGoogleLogin(
      setIsGoogleLoading,
      googleInitialized,
      googleButtonRef,
      handleGoogleCredentialResponse
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Wallpaper */}
      <AuthWallpaper />

      {/* Right side - Login Form */}
      <div className="relative flex w-full items-center justify-center overflow-hidden bg-white p-8 lg:w-1/2 dark:bg-gray-900">
        {/* Animated background with flying objects */}
        <FlyingObjectsBackground />

        {/* Top navigation bar */}
        <div className="absolute top-4 right-4 left-4 z-10 flex items-center justify-between">
          {/* Back to home */}
          <Link
            href="/"
            className="flex items-center text-gray-700 transition-colors hover:text-[#1F4E79] dark:text-gray-300 dark:hover:text-[#C9A24D]"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="text-sm font-medium">Quay lại trang chủ</span>
          </Link>
          {/* Dark theme toggle */}
          <DarkThemeToggle />
        </div>

        <div className="relative z-10 w-full max-w-lg space-y-8">
          <div>
            <h1 className="text-center text-4xl font-bold text-[#1F4E79] dark:text-white">
              Chào mừng trở lại
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Đăng nhập để tiếp tục học tập
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-[#1E1E1E] dark:text-gray-300">
                  Email
                </Label>
                <TextInput
                  id="email"
                  type="email"
                  placeholder="example@edu-acas.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-[#1E1E1E] dark:text-gray-300">
                  Mật khẩu
                </Label>
                <TextInput
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[#1F4E79] focus:ring-[#1F4E79] dark:border-gray-600 dark:bg-gray-700"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <Label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
                >
                  Ghi nhớ đăng nhập
                </Label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-[#C9A24D] hover:text-[#1F4E79] dark:hover:text-white transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full text-white shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ backgroundColor: "#1F4E79" }}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="font-medium text-[#C9A24D] hover:text-[#1F4E79] dark:hover:text-white transition-colors"
              >
                Đăng ký ngay
              </Link>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  Hoặc đăng nhập với
                </span>
              </div>
            </div>

            {/* Login with Google */}
            <div className="relative">
              {/* Hidden container for Google button - will be rendered by Google Identity Services */}
              <div 
                ref={googleButtonRef} 
                className="absolute inset-0 opacity-0 pointer-events-none z-10"
                style={{ minHeight: '42px' }}
              />
              
              <Button
                type="button"
                onClick={onGoogleLogin}
                disabled={isGoogleLoading || isLoading}
                className="w-full border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer relative z-0"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Đăng nhập bằng Google
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
