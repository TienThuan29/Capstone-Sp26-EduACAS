"use client"

import { Card } from "flowbite-react"
import HomeNavbar from "@/components/home-navbar"
import Footer from "@/components/Footer"
import { SparklesIcon } from "@/components/svg-icons"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HomeNavbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-[#F5F7FA] to-white dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto max-w-7xl text-center">
          <div
            className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full text-sm font-semibold bg-white dark:bg-gray-700 text-[#1F4E79] dark:text-[#C9A24D] shadow-lg"
          >
            <SparklesIcon /> LIÊN HỆ
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-[#1F4E79] dark:text-white">Liên hệ với </span>
            <span className="text-[#C9A24D]">chúng tôi</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ với chúng tôi qua các phương thức bên dưới
          </p>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-4">
                  Thông tin liên hệ
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  Chọn phương thức liên hệ phù hợp với bạn
                </p>
              </div>

              <Card className="p-6 border-2 bg-[#F5F7FA] dark:bg-gray-800" style={{ borderColor: "#C9A24D" }}>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-white dark:bg-gray-700">
                      <svg className="w-6 h-6" fill="none" stroke="#C9A24D" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-2">
                        Email
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        support@edu-acas.edu.vn
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Phản hồi trong vòng 24 giờ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-white dark:bg-gray-700">
                      <svg className="w-6 h-6" fill="none" stroke="#C9A24D" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-2">
                        Hotline
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        (+84) 123 456 789
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Thứ 2 - Thứ 6, 8:00 - 17:00
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-white dark:bg-gray-700">
                      <svg className="w-6 h-6" fill="none" stroke="#C9A24D" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-2">
                        Địa chỉ
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        Trường Đại học FPT
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Hòa Lạc, Hà Nội, Việt Nam
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-2 bg-[#F5F7FA] dark:bg-gray-800" style={{ borderColor: "#1F4E79" }}>
                <h4 className="text-lg font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-4">
                  Kết nối với chúng tôi
                </h4>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="p-3 rounded-lg bg-white dark:bg-gray-700 hover:scale-110 transition-transform"
                    aria-label="Facebook"
                  >
                    <svg className="w-6 h-6" fill="#1F4E79" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="p-3 rounded-lg bg-white dark:bg-gray-700 hover:scale-110 transition-transform"
                    aria-label="Twitter"
                  >
                    <svg className="w-6 h-6" fill="#1F4E79" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="p-3 rounded-lg bg-white dark:bg-gray-700 hover:scale-110 transition-transform"
                    aria-label="LinkedIn"
                  >
                    <svg className="w-6 h-6" fill="#1F4E79" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="p-3 rounded-lg bg-white dark:bg-gray-700 hover:scale-110 transition-transform"
                    aria-label="GitHub"
                  >
                    <svg className="w-6 h-6" fill="#1F4E79" viewBox="0 0 24 24">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                  </a>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="p-8 border-2 bg-[#F5F7FA] dark:bg-gray-800" style={{ borderColor: "#C9A24D" }}>
              <h3 className="text-2xl font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-6">
                Gửi tin nhắn cho chúng tôi
              </h3>
              <form className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#C9A24D] bg-white dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="Nhập họ tên của bạn"
                    style={{ borderColor: "#E5E7EB" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#C9A24D] bg-white dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="email@example.com"
                    style={{ borderColor: "#E5E7EB" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#C9A24D] bg-white dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="(+84) 123 456 789"
                    style={{ borderColor: "#E5E7EB" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chủ đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#C9A24D] bg-white dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="Chủ đề tin nhắn"
                    style={{ borderColor: "#E5E7EB" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#C9A24D] resize-none bg-white dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="Nhập nội dung tin nhắn của bạn..."
                    style={{ borderColor: "#E5E7EB" }}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-4 text-white font-bold rounded-lg hover:scale-105 transition-all shadow-lg text-lg"
                  style={{ background: "linear-gradient(90deg, #1F4E79 0%, #C9A24D 100%)" }}
                >
                  Gửi tin nhắn
                </button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-[#F5F7FA] dark:bg-gray-800">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-4">
              Câu hỏi thường gặp
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Tìm câu trả lời cho các câu hỏi phổ biến
            </p>
          </div>

          <div className="space-y-4">
            <Card className="p-6 border-2 bg-white dark:bg-gray-700" style={{ borderColor: "#C9A24D" }}>
              <h4 className="text-lg font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-2">
                Làm thế nào để đăng ký tài khoản?
              </h4>
              <p className="text-gray-700 dark:text-gray-300">
                Bạn có thể đăng ký tài khoản bằng cách click vào nút "Đăng ký" ở góc trên bên phải và điền thông tin cần thiết.
              </p>
            </Card>

            <Card className="p-6 border-2 bg-white dark:bg-gray-700" style={{ borderColor: "#C9A24D" }}>
              <h4 className="text-lg font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-2">
                Edu-ACAS hỗ trợ những ngôn ngữ lập trình nào?
              </h4>
              <p className="text-gray-700 dark:text-gray-300">
                Hiện tại chúng tôi hỗ trợ Python, Java, C++, JavaScript và nhiều ngôn ngữ khác. Danh sách đầy đủ có thể xem tại trang Features.
              </p>
            </Card>

            <Card className="p-6 border-2 bg-white dark:bg-gray-700" style={{ borderColor: "#C9A24D" }}>
              <h4 className="text-lg font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-2">
                Có mất phí khi sử dụng nền tảng không?
              </h4>
              <p className="text-gray-700 dark:text-gray-300">
                Edu-ACAS miễn phí cho sinh viên FPT University. Các trường khác vui lòng liên hệ để biết thêm thông tin.
              </p>
            </Card>

            <Card className="p-6 border-2 bg-white dark:bg-gray-700" style={{ borderColor: "#C9A24D" }}>
              <h4 className="text-lg font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-2">
                Tôi quên mật khẩu, phải làm sao?
              </h4>
              <p className="text-gray-700 dark:text-gray-300">
                Bạn có thể click vào "Quên mật khẩu" ở trang đăng nhập và làm theo hướng dẫn để khôi phục mật khẩu.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
