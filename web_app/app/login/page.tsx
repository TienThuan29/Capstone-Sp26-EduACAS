"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, DarkThemeToggle, Label, TextInput } from "flowbite-react";
import Link from "next/link";
import AuthWallpaper from "@/components/auth-wallpaper";
import FlyingObjectsBackground from "@/components/flying-objects-background";
import { useAuth } from "@/contexts/AuthContext";
import { config } from "@/configs/config";
import { handleGoogleLogin } from "./google-login";
import { GoogleIcon } from "@/components/svg-icons";

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
            <span className="text-sm font-medium">Back to home</span>
          </Link>
          {/* Dark theme toggle */}
          <DarkThemeToggle />
        </div>

        <div className="relative z-10 w-full max-w-lg space-y-8">
          <div>
            <h1 className="text-center text-4xl font-bold text-[#1F4E79] dark:text-white">
              Welcome Back
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Login to continue learning
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-[#1E1E1E] dark:text-gray-300">
                  Email Address
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
                  Password
                </Label>
                <TextInput
                  id="password"
                  type="password"
                  placeholder="********"
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
                  Remember me
                </Label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-[#C9A24D] hover:text-[#1F4E79] dark:hover:text-white transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full text-white hover:shadow-xl transition-all duration-300 cursor-pointer"
                style={{ backgroundColor: "#1F4E79" }}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-[#C9A24D] hover:text-[#1F4E79] dark:hover:text-white transition-colors"
              >
                Register now
              </Link>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  Or sign in with
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
                className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer relative z-0 cursor-pointer"
              >
                <GoogleIcon />
                Sign in with Google
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
