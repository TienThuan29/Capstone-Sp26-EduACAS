"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Button, DarkThemeToggle, Label, TextInput } from "flowbite-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthWallpaper from "@/components/auth-wallpaper";
import FlyingObjectsBackground from "@/components/flying-objects-background";
import { Api } from "@/configs/api";
import { useToast } from "@/hooks/useToast";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    text: string;
    color: string;
  }>({ score: 0, text: "", color: "" });

  useEffect(() => {
    // Get email from URL parameters
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      showToast("Không tìm thấy thông tin email. Vui lòng thử lại.", "error");
      router.push("/login");
    }
  }, [searchParams, router, showToast]);

  // Password strength calculator
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength({ score: 0, text: "", color: "" });
      return;
    }

    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword)) score++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) score++;

    let text = "";
    let color = "";
    
    if (score <= 2) {
      text = "Yếu";
      color = "bg-red-500";
    } else if (score === 3) {
      text = "Trung bình";
      color = "bg-yellow-500";
    } else if (score === 4) {
      text = "Mạnh";
      color = "bg-blue-500";
    } else {
      text = "Rất mạnh";
      color = "bg-green-500";
    }

    setPasswordStrength({ score, text, color });
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (newPassword.length < 5) {
      showToast("Mật khẩu phải có ít nhất 5 ký tự", "error");
      return;
    }

    if (newPassword.length > 64) {
      showToast("Mật khẩu không được vượt quá 64 ký tự", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Get token from localStorage
      const token = localStorage.getItem("accessToken");
      if (!token) {
        showToast("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "error");
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${Api.BASE_API}${Api.Auth.RESET_FIRST_LOGIN_PASSWORD}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            email,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đặt lại mật khẩu thất bại");
      }

      showToast("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.", "success");
      
      // Clear token and redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      console.error("Reset password error:", error);
      showToast(
        error instanceof Error ? error.message : "Đặt lại mật khẩu thất bại",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Wallpaper */}
      <AuthWallpaper />

      {/* Right side - Reset Password Form */}
      <div className="relative flex w-full items-center justify-center overflow-hidden bg-white p-8 lg:w-1/2 dark:bg-gray-900">
        {/* Animated background with flying objects */}
        <FlyingObjectsBackground />

        {/* Top navigation bar */}
        <div className="absolute top-4 right-4 left-4 z-10 flex items-center justify-between">
          {/* Back to login */}
          <Link
            href="/login"
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
            <span className="text-sm font-medium">Quay lại đăng nhập</span>
          </Link>
          {/* Dark theme toggle */}
          <DarkThemeToggle />
        </div>

        <div className="relative z-10 w-full max-w-lg space-y-8">
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-center text-4xl font-bold text-[#1F4E79] dark:text-white">
              Đặt lại mật khẩu
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Đây là lần đăng nhập đầu tiên. Vui lòng đặt mật khẩu mới để tiếp tục.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* New Password */}
              <div>
                <Label htmlFor="newPassword" className="text-[#1E1E1E] dark:text-gray-300">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <TextInput
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới (5-64 ký tự)"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={5}
                    maxLength={64}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Độ mạnh mật khẩu:
                      </span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.score <= 2 ? 'text-red-500' :
                        passwordStrength.score === 3 ? 'text-yellow-500' :
                        passwordStrength.score === 4 ? 'text-blue-500' : 'text-green-500'
                      }`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword" className="text-[#1E1E1E] dark:text-gray-300">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <TextInput
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={5}
                    maxLength={64}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    Mật khẩu xác nhận không khớp
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="mt-1 text-xs text-green-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mật khẩu khớp
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                disabled={isLoading || newPassword !== confirmPassword || !newPassword || !confirmPassword}
                className="w-full text-white shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ backgroundColor: "#1F4E79" }}
              >
                {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </Button>
            </div>

            {/* Info message */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Sau khi đặt lại mật khẩu, bạn sẽ cần đăng nhập lại</li>
                    <li>Hãy ghi nhớ mật khẩu mới của bạn</li>
                    <li>Không chia sẻ mật khẩu với bất kỳ ai</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F4E79] mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
