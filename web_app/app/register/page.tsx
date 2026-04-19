"use client";

import React, { useState } from "react";
import { Button, DarkThemeToggle, Label, TextInput, Select } from "flowbite-react";
import Link from "next/link";
import AuthWallpaper from "@/components/auth-wallpaper";
import FlyingObjectsBackground from "@/components/flying-objects-background";
import { GoogleIcon } from "@/components/svg-icons";

export default function RegisterPage() {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("Confirm password does not match!");
      return;
    }
    
    if (!agreeTerms) {
      alert("Please agree to the terms of service!");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Registering with email...");
      // TODO: Implement registration logic
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    console.log("Registering with Google...");
    // TODO: Implement Google OAuth
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Wallpaper */}
      <AuthWallpaper />

      {/* Right side - Register Form */}
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

        <div className="relative z-10 w-full max-w-lg space-y-8 py-8">
          <div>
            <h1 className="text-center text-4xl font-bold text-[#1F4E79] dark:text-white">
              Create New Account
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Register to start your learning journey
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullname" className="text-[#1E1E1E] dark:text-gray-300">
                  Full Name
                </Label>
                <TextInput
                  id="fullname"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="mt-1"
                />
              </div>

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
                <Label htmlFor="role" className="text-[#1E1E1E] dark:text-gray-300">
                  Role
                </Label>
                <Select
                  id="role"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1"
                >
                  <option value="">Select role</option>
                  <option value="student">Student</option>
                  <option value="teacher">Lecturer</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="password" className="text-[#1E1E1E] dark:text-gray-300">
                  Password
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum 8 characters
                </p>
              </div>

              <div>
                <Label htmlFor="confirm-password" className="text-[#1E1E1E] dark:text-gray-300">
                  Confirm Password
                </Label>
                <TextInput
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 mt-1 rounded border-gray-300 text-[#1F4E79] focus:ring-[#1F4E79] dark:border-gray-600 dark:bg-gray-700"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <Label htmlFor="terms" className="text-sm text-gray-900 dark:text-gray-300">
                I agree with the{" "}
                <Link
                  href="#"
                  className="text-[#C9A24D] hover:text-[#1F4E79] dark:hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>{" "}
                và{" "}
                <Link
                  href="#"
                  className="text-[#C9A24D] hover:text-[#1F4E79] dark:hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full text-white hover:shadow-xl transition-all duration-300"
                style={{ backgroundColor: "#1F4E79" }}
              >
                {isLoading ? "Registering..." : "Register"}
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

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  Or register with
                </span>
              </div>
            </div>

            {/* Register with Google */}
            <div>
              <Button
                type="button"
                onClick={handleGoogleRegister}
                className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <GoogleIcon />
                Register with Google
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
