"use client"

import { Card } from "flowbite-react"
import Link from "next/link"
import HomeNavbar from "@/components/home-navbar"
import Footer from "@/components/footer"
import { SparklesIcon } from "@/components/svg-icons"
import { features } from "@/MockData/landingPageData"

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HomeNavbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-[#F5F7FA] to-white dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto max-w-7xl text-center">
          <div
            className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full text-sm font-semibold bg-white dark:bg-gray-700 text-[#C9A24D] shadow-lg"
          >
            <SparklesIcon /> TÍNH NĂNG NỔI BẬT
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-[#1F4E79] dark:text-white">Tính năng </span>
            <span className="text-[#C9A24D]">nổi bật</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Mọi thứ bạn cần cho việc giảng dạy và học tập lập trình một cách hiệu quả và chuyên nghiệp
          </p>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card
                  key={index}
                  className="p-8 hover:shadow-2xl transition-all duration-300 border-2 bg-[#F5F7FA] dark:bg-gray-800 hover:scale-105"
                  style={{ borderColor: "#C9A24D" }}
                >
                  <div className="text-center space-y-4">
                    <div
                      className="inline-block p-5 rounded-xl bg-white dark:bg-gray-700"
                      style={{ border: "2px solid #C9A24D" }}
                    >
                      <IconComponent />
                    </div>
                    <h3 className="text-2xl font-bold text-[#1F4E79] dark:text-[#C9A24D]">
                      {feature.title}
                    </h3>
                    <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Detailed Features Section */}
      <section className="py-20 px-4 bg-[#F5F7FA] dark:bg-gray-800">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-4">
              Tính năng chi tiết
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Khám phá các tính năng mạnh mẽ của Edu-ACAS
            </p>
          </div>

          <div className="space-y-12">
            {/* Feature 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <Card className="p-8 border-2 bg-white dark:bg-gray-700" style={{ borderColor: "#C9A24D" }}>
                <div className="space-y-4">
                  <div className="inline-block px-4 py-2 rounded-full bg-[#C9A24D] text-white text-sm font-semibold">
                    CHO SINH VIÊN
                  </div>
                  <h3 className="text-3xl font-bold text-[#1F4E79] dark:text-[#C9A24D]">
                    Học tập linh hoạt
                  </h3>
                  <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-[#C9A24D] text-xl">✓</span>
                      <span>Truy cập bài giảng và tài liệu mọi lúc, mọi nơi</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#C9A24D] text-xl">✓</span>
                      <span>Thực hành code trực tiếp trên trình duyệt</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#C9A24D] text-xl">✓</span>
                      <span>Nhận phản hồi tự động và chi tiết</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#C9A24D] text-xl">✓</span>
                      <span>Theo dõi tiến độ học tập của bản thân</span>
                    </li>
                  </ul>
                </div>
              </Card>

              <Card className="p-8 border-2 bg-white dark:bg-gray-700" style={{ borderColor: "#1F4E79" }}>
                <div className="space-y-4">
                  <div className="inline-block px-4 py-2 rounded-full bg-[#1F4E79] text-white text-sm font-semibold">
                    CHO GIẢNG VIÊN
                  </div>
                  <h3 className="text-3xl font-bold text-[#1F4E79] dark:text-[#C9A24D]">
                    Quản lý hiệu quả
                  </h3>
                  <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-[#1F4E79] dark:text-[#C9A24D] text-xl">✓</span>
                      <span>Tạo và quản lý bài tập, đề thi dễ dàng</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#1F4E79] dark:text-[#C9A24D] text-xl">✓</span>
                      <span>Chấm điểm tự động tiết kiệm thời gian</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#1F4E79] dark:text-[#C9A24D] text-xl">✓</span>
                      <span>Theo dõi tiến độ của từng sinh viên</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#1F4E79] dark:text-[#C9A24D] text-xl">✓</span>
                      <span>Báo cáo và thống kê chi tiết</span>
                    </li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Feature 2 */}
            <Card className="p-12 border-2 bg-white dark:bg-gray-700" style={{ borderColor: "#C9A24D" }}>
              <div className="text-center space-y-6">
                <h3 className="text-3xl font-bold text-[#1F4E79] dark:text-[#C9A24D]">
                  Hệ thống chấm điểm tự động
                </h3>
                <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                  Sử dụng công nghệ AI và thuật toán tiên tiến để chấm điểm code tự động, cung cấp phản hồi chi tiết về cú pháp, logic, hiệu suất và độ tối ưu của code
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
                  <div>
                    <div className="text-4xl font-bold text-[#C9A24D] mb-2">100%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Tự động</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-[#C9A24D] mb-2">&lt;1s</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Thời gian chấm</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-[#C9A24D] mb-2">24/7</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sẵn sàng</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-[#C9A24D] mb-2">∞</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Số lần thử</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#1F4E79] to-[#C9A24D]">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Sẵn sàng trải nghiệm?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Bắt đầu học lập trình ngay hôm nay với Edu-ACAS
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-[#1F4E79] rounded-lg font-bold text-lg hover:scale-105 transition-all shadow-lg"
            >
              Đăng ký ngay
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-bold text-lg hover:scale-105 transition-all"
            >
              Tìm hiểu thêm
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
