"use client";

import React, { useState } from "react";
import { Button, DarkThemeToggle, Label, TextInput } from "flowbite-react";
import Link from "next/link";
import AuthWallpaper from "@/components/auth-wallpaper";
import FlyingObjectsBackground from "@/components/flying-objects-background";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log("Sending password reset request for:", email);
      // TODO: Implement forgot password logic
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSubmitted(true);
    } catch (error) {
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Wallpaper */}
      <AuthWallpaper />

      {/* Right side - Forgot Password Form */}
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
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          {/* Dark theme toggle */}
          <DarkThemeToggle />
        </div>

        <div className="relative z-10 w-full max-w-lg space-y-8">
          {!isSubmitted ? (
            <>
              <div>
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-[#1F4E79]/10 dark:bg-[#C9A24D]/10">
                    <svg
                      className="w-12 h-12 text-[#1F4E79] dark:text-[#C9A24D]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>
                <h1 className="text-center text-4xl font-bold text-[#1F4E79] dark:text-white">
                  Forgot Password?
                </h1>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                  No worries! Enter your email and we&apos;ll send you instructions to reset your password.
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
                      icon={() => (
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full text-white hover:shadow-xl transition-all duration-300"
                    style={{ backgroundColor: "#1F4E79" }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Sending...
                      </div>
                    ) : (
                      "Send Password Reset Request"
                    )}
                  </Button>
                </div>

                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-[#C9A24D] hover:text-[#1F4E79] dark:hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <>
              <div>
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                    <svg
                      className="w-12 h-12 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                      />
                    </svg>
                  </div>
                </div>
                <h1 className="text-center text-4xl font-bold text-[#1F4E79] dark:text-white">
                  Check Your Email
                </h1>
                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  We&apos;ve sent password reset instructions to:
                </p>
                <p className="mt-2 text-center text-base font-semibold text-[#1F4E79] dark:text-[#C9A24D]">
                  {email}
                </p>
                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  Please check your inbox (and spam) and follow the instructions to reset your password.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-[#F5F7FA] dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Did not receive the email?
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail("");
                    }}
                    className="mt-2 text-sm font-medium text-[#C9A24D] hover:text-[#1F4E79] dark:hover:text-white transition-colors w-full"
                  >
                    Try with a different email
                  </button>
                </div>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-sm font-medium text-[#1F4E79] dark:text-[#C9A24D] hover:underline transition-colors"
                  >
                    <svg
                      className="mr-2 h-4 w-4"
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
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
