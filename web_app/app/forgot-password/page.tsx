"use client";

import axios from "axios";
import React, { useState } from "react";
import { Button, DarkThemeToggle, Label, TextInput } from "flowbite-react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  LockClosedIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import AuthWallpaper from "@/components/auth-wallpaper";
import FlyingObjectsBackground from "@/components/flying-objects-background";
import { PageUrl } from "@/configs/page.url";
import { Api } from "@/configs/api";

type EmailValidationState = "idle" | "checking" | "exists" | "not_found" | "error";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailValidation, setEmailValidation] = useState<EmailValidationState>("idle");
  const [validationMessage, setValidationMessage] = useState("");

  const validateEmail = async (emailToCheck: string) => {
    if (!emailToCheck || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToCheck)) {
      setEmailValidation("idle");
      setValidationMessage("");
      return;
    }

    setEmailValidation("checking");
    try {
      const response = await axios.get(
        `${Api.BASE_API}${Api.Auth.CHECK_EMAIL}`,
        { params: { email: emailToCheck } }
      );

      if (response.data.success) {
        if (response.data.dataResponse?.exists) {
          setEmailValidation("exists");
          setValidationMessage("");
        } else {
          setEmailValidation("not_found");
          setValidationMessage("No account found with this email address.");
        }
      } else {
        setEmailValidation("error");
        setValidationMessage("Could not verify email. Please try again.");
      }
    } catch {
      setEmailValidation("error");
      setValidationMessage("Could not verify email. Please try again.");
    }
  };

  const handleEmailBlur = () => {
    if (email) {
      validateEmail(email);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailValidation !== "idle") {
      setEmailValidation("idle");
      setValidationMessage("");
    }
  };

  const getEmailIcon = () => {
    if (emailValidation === "checking") {
      return <ArrowPathIcon className="w-5 h-5 text-gray-500 animate-spin" />;
    }
    if (emailValidation === "exists") {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }
    if (emailValidation === "not_found" || emailValidation === "error") {
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    }
    return <EnvelopeIcon className="w-5 h-5 text-gray-500" />;
  };

  const isSubmitDisabled = () => {
    return (
      isLoading ||
      !email ||
      emailValidation === "checking" ||
      emailValidation === "not_found" ||
      emailValidation === "error"
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      
      console.log(`${Api.BASE_API}${Api.Auth.FORGOT_PASSWORD}`);
      
      const response = await axios.post(
        `${Api.BASE_API}${Api.Auth.FORGOT_PASSWORD}`,
        { email }
      );

      if (response.data.success) {
        setIsSubmitted(true);
      } else {
        setEmailValidation("error");
        setValidationMessage(response.data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setEmailValidation("error");
      setValidationMessage("Could not send reset request. Please try again.");
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
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
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
                    <LockClosedIcon className="w-12 h-12 text-[#1F4E79] dark:text-[#C9A24D]" />
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
                      onChange={handleEmailChange}
                      onBlur={handleEmailBlur}
                      className="mt-1"
                      icon={getEmailIcon}
                      color={emailValidation === "not_found" || emailValidation === "error" ? "failure" : emailValidation === "exists" ? "success" : "gray"}
                    />
                    {validationMessage && (
                      <p className={`mt-2 text-sm ${emailValidation === "not_found" ? "text-red-500" : "text-red-500"}`}>
                        {validationMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={isSubmitDisabled()}
                    className="w-full text-white hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    style={{ backgroundColor: "#1F4E79" }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
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
                    href={PageUrl.LOGIN_PAGE}
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
                    <EnvelopeIcon className="w-12 h-12 text-green-600 dark:text-green-400" />
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
                      setEmailValidation("idle");
                      setValidationMessage("");
                    }}
                    className="mt-2 text-sm font-medium text-[#C9A24D] hover:text-[#1F4E79] dark:hover:text-white transition-colors w-full"
                  >
                    Try with a different email
                  </button>
                </div>

                <div className="text-center">
                  <Link
                    href={PageUrl.LOGIN_PAGE}
                    className="inline-flex items-center text-sm font-medium text-[#1F4E79] dark:text-[#C9A24D] hover:underline transition-colors"
                  >
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
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
