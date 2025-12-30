"use client"

import { Button, Card, Checkbox, Label, TextInput } from "flowbite-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/edu-acas-20logo.jpeg" alt="Edu-ACAS Logo" className="h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#1F4E79]">Đăng nhập</h1>
          <p className="text-[#1E1E1E]/70 mt-2">Chào mừng trở lại!</p>
        </div>

        <Card className="shadow-lg">
          <form className="space-y-6">
            <div>
              <div className="mb-2">
                <Label htmlFor="email" className="text-[#1E1E1E]">
                  Email
                </Label>
              </div>
              <TextInput
                id="email"
                type="email"
                placeholder="example@edu-acas.com"
                required
                className="[&>input]:focus:border-[#1F4E79] [&>input]:focus:ring-[#1F4E79]"
              />
            </div>

            <div>
              <div className="mb-2">
                <Label htmlFor="password" className="text-[#1E1E1E]">
                  Mật khẩu
                </Label>
              </div>
              <TextInput
                id="password"
                type="password"
                placeholder="••••••••"
                required
                className="[&>input]:focus:border-[#1F4E79] [&>input]:focus:ring-[#1F4E79]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" className="text-[#1F4E79] focus:ring-[#1F4E79]" />
                <Label htmlFor="remember" className="text-sm text-[#1E1E1E]/70">
                  Ghi nhớ đăng nhập
                </Label>
              </div>
              <a href="#" className="text-sm text-[#C9A24D] hover:text-[#1F4E79] transition-colors">
                Quên mật khẩu?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1F4E79] hover:bg-[#1F4E79]/90 focus:ring-4 focus:ring-[#1F4E79]/50"
            >
              Đăng nhập
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#1E1E1E]/70">hoặc</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-[#1E1E1E]/70">
              Chưa có tài khoản?{" "}
              <a href="/register" className="text-[#C9A24D] hover:text-[#1F4E79] font-semibold transition-colors">
                Đăng ký ngay
              </a>
            </p>
          </div>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a href="/" className="text-[#1F4E79] hover:text-[#C9A24D] transition-colors inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại trang chủ
          </a>
        </div>
      </div>
    </div>
  )
}
