"use client";

import React, { useState} from "react";
import { Button, DarkThemeToggle, Label, TextInput } from "flowbite-react";
import { useRouter } from "next/navigation";
import axios, { HttpStatusCode } from "axios";
import AuthWallpaper from "@/components/auth-wallpaper";
import FlyingObjectsBackground from "@/components/flying-objects-background";
import { useAuth } from "@/contexts/AuthContext";
import { useFirstLoginPageProtection } from "@/hooks/authorization/useFirstLoginProtection";
import { Api } from "@/configs/api";
import { useToast } from "@/hooks/useToast";

export default function FirstLoginPage() {
  const { user, logout, authTokens } = useAuth();
  const { canAccess, isLoading } = useFirstLoginPageProtection();
  const router = useRouter();
  const toast = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.showError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 8) {
      toast.showError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        Api.BASE_API + Api.Auth.RESET_FIRST_LOGIN_PASSWORD, 
        {
          email: user?.email,
          newPassword: password,
          confirmPassword: confirmPassword
        },
        {
            headers: {
                Authorization: `Bearer ${authTokens?.accessToken}`
            }
        }
      );

      if (response.status === HttpStatusCode.Ok) {
        toast.showSuccess("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
        await logout(); // Force logout so they login with new password
      }
    } catch (error) {
      console.error("Reset password error:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.showError(error.response.data.message || "Có lỗi xảy ra");
      } else {
        toast.showError("Đã có lỗi xảy ra");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading || !canAccess || !user) return null;

  return (
    <div className="flex min-h-screen">
      {/* Left side - Wallpaper */}
      <AuthWallpaper />

      {/* Right side - Form */}
      <div className="relative flex w-full items-center justify-center overflow-hidden bg-white p-8 lg:w-1/2 dark:bg-gray-900">
        {/* Animated background with flying objects */}
        <FlyingObjectsBackground />

        {/* Top navigation bar */}
        <div className="absolute top-4 right-4 left-4 z-10 flex items-center justify-between">
          <div className="w-8"></div> {/* Spacer to balance Flex layout if needed, or just justify-end */}
          {/* Dark theme toggle */}
          <DarkThemeToggle />
        </div>

        <div className="relative z-10 w-full max-w-lg space-y-8">
          <div>
            <h1 className="text-center text-4xl font-bold text-[#1F4E79] dark:text-white">
              Lần đầu đăng nhập
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Vui lòng đổi mật khẩu để bảo mật tài khoản của bạn
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
                  value={user.email}
                  disabled
                  readOnly
                  className="mt-1 opacity-75"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-[#1E1E1E] dark:text-gray-300">
                  Mật khẩu mới
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

              <div>
                <Label htmlFor="confirmPassword" className="text-[#1E1E1E] dark:text-gray-300">
                  Xác nhận mật khẩu
                </Label>
                <TextInput
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isSubmitting || !password || !confirmPassword}
                className="w-full text-white shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ backgroundColor: "#1F4E79" }}
              >
                {isSubmitting ? "Đang xử lý..." : "Đổi mật khẩu"}
              </Button>
            </div>
            
            <div className="text-center">
                 <button 
                    type="button"
                    onClick={() => logout()}
                    className="text-sm font-medium text-gray-600 hover:text-[#1F4E79] dark:text-gray-400 dark:hover:text-white transition-colors"
                 >
                    Đăng xuất
                 </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
