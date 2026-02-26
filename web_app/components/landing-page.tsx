"use client"

import { Card } from "flowbite-react"
import Image from "next/image"

export default function LandingPage() {
  const UsersIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="#C9A24D" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )

  const BookOpenIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="#C9A24D" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )

  const ClipboardIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="#C9A24D" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  )

  const FileCodeIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="#C9A24D" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <polyline points="10 13 8 15 10 17" />
      <polyline points="14 13 16 15 14 17" />
    </svg>
  )

  const CheckCircleIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="#C9A24D" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )

  const BarChartIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="#C9A24D" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Hero Section */}
      <section className="py-20 px-4 min-h-screen flex items-center" style={{ backgroundColor: "#F5F7FA" }}>
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{ background: `linear-gradient(90deg, #1F4E79 0%, #C9A24D 50%, #1F4E79 100%)` }}
        />

        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Logo Section */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <div
                  className="p-8 rounded-2xl"
                  style={{ backgroundColor: "#FFFFFF", border: "3px solid #C9A24D" }}
                >
                  <Image
                    src="/images/Edu-ACAS logo.png"
                    alt="Edu-ACAS Logo"
                    width={400}
                    height={400}
                    className="rounded-xl w-full"
                  />
                  <div className="absolute -top-4 -left-4 text-4xl font-mono font-bold" style={{ color: "#1F4E79" }}>
                    {"<"}
                  </div>
                  <div
                    className="absolute -bottom-4 -right-4 text-4xl font-mono font-bold"
                    style={{ color: "#C9A24D" }}
                  >
                    {"/>"}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-6">
              <div
                className="inline-block px-5 py-2 rounded-full text-sm font-bold"
                style={{ backgroundColor: "#C9A24D", color: "#FFFFFF" }}
              >
                🎓 E-LEARNING PLATFORM
              </div>

              <h1 className="text-5xl md:text-6xl font-bold">
                <span style={{ color: "#1F4E79" }}>Edu</span>
                <span style={{ color: "#C9A24D" }}>-ACAS</span>
              </h1>

              <div className="space-y-3">
                <h2 className="text-3xl font-semibold" style={{ color: "#1F4E79" }}>
                  Nền tảng E-Learning
                  <br />
                  <span style={{ color: "#C9A24D" }}>Lập trình chuyên nghiệp</span>
                </h2>
                <p className="text-lg opacity-80" style={{ color: "#1E1E1E" }}>
                  Kết nối giảng viên và sinh viên trong việc giảng dạy, học tập và thực hành các ngôn ngữ lập trình
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  className="px-10 py-4 rounded-lg text-white font-bold text-lg hover:scale-105 transition-transform"
                  style={{ backgroundColor: "#1F4E79" }}
                >
                  Bắt đầu →
                </button>
                <span className="font-mono text-sm opacity-60" style={{ color: "#1F4E79" }}>
                  {"// Miễn phí tham gia"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6">
                {[
                  { number: "4+", label: "Ngôn ngữ" },
                  { number: "∞", label: "Bài tập" },
                  { number: "24/7", label: "Hỗ trợ" },
                ].map((stat, index) => (
                  <div key={index}>
                    <div className="text-3xl font-bold font-mono" style={{ color: "#C9A24D" }}>
                      {stat.number}
                    </div>
                    <div className="text-sm opacity-70" style={{ color: "#1E1E1E" }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div
              className="inline-block mb-3 px-5 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#F5F7FA", color: "#C9A24D" }}
            >
              ✨ TÍNH NĂNG NỔI BẬT
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#1F4E79" }}>
              Tính năng nổi bật
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#1E1E1E" }}>
              Mọi thứ bạn cần cho việc giảng dạy và học tập lập trình
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <UsersIcon />,
                title: "Quản lý lớp học",
                description:
                  "Giảng viên dễ dàng tạo và quản lý các lớp học, thêm sinh viên vào lớp. Nội dung chi tiết sẽ được bổ sung sau.",
              },
              {
                icon: <BookOpenIcon />,
                title: "Tài liệu học tập",
                description:
                  "Chia sẻ tài liệu, slide bài giảng và tài nguyên học tập cho sinh viên. Nội dung chi tiết sẽ được bổ sung sau.",
              },
              {
                icon: <ClipboardIcon />,
                title: "Giao bài tập",
                description:
                  "Giảng viên tạo và phân công bài tập lập trình cho sinh viên. Nội dung chi tiết sẽ được bổ sung sau.",
              },
              {
                icon: <FileCodeIcon />,
                title: "Nộp bài trực tuyến",
                description:
                  "Sinh viên nộp bài tập code trực tiếp trên hệ thống. Nội dung chi tiết sẽ được bổ sung sau.",
              },
              {
                icon: <CheckCircleIcon />,
                title: "Chấm điểm tự động",
                description:
                  "Hệ thống tự động kiểm tra và chấm điểm bài tập của sinh viên. Nội dung chi tiết sẽ được bổ sung sau.",
              },
              {
                icon: <BarChartIcon />,
                title: "Theo dõi tiến độ",
                description:
                  "Giảng viên theo dõi tiến độ học tập của từng sinh viên. Nội dung chi tiết sẽ được bổ sung sau.",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all border-2"
                style={{ backgroundColor: "#F5F7FA", borderColor: "#C9A24D" }}
              >
                <div className="p-6 text-center space-y-4">
                  <div
                    className="inline-block p-4 rounded-xl"
                    style={{ backgroundColor: "#FFFFFF", border: "2px solid #C9A24D" }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: "#1F4E79" }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#1E1E1E" }}>
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Users Section */}
      <section className="py-20 px-4" style={{ backgroundColor: "#F5F7FA" }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div
              className="inline-block mb-3 px-5 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#FFFFFF", color: "#1F4E79" }}
            >
              📊 THỐNG KÊ
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#1F4E79" }}>
              Cộng đồng của chúng tôi
            </h2>
            <p className="text-lg" style={{ color: "#1E1E1E" }}>
              Tham gia nền tảng đang phát triển
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: "0", label: "Sinh viên hoạt động", sublabel: "Chưa có người dùng" },
              { number: "0", label: "Giảng viên", sublabel: "Chưa có người dùng" },
              { number: "0", label: "Lớp học", sublabel: "Chưa có người dùng" },
            ].map((stat, index) => (
              <Card
                key={index}
                className="text-center p-8 hover:shadow-lg transition-all border-2"
                style={{ backgroundColor: "#FFFFFF", borderColor: "#C9A24D" }}
              >
                <div className="font-mono text-6xl font-bold mb-3" style={{ color: "#C9A24D" }}>
                  {stat.number}
                </div>
                <p className="text-xl font-semibold mb-1" style={{ color: "#1F4E79" }}>
                  {stat.label}
                </p>
                <p className="text-sm opacity-60" style={{ color: "#1E1E1E" }}>
                  {stat.sublabel}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div
              className="inline-block mb-3 px-5 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#F5F7FA", color: "#C9A24D" }}
            >
              💻 NGÔN NGỮ LẬP TRÌNH
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#1F4E79" }}>
              Các ngôn ngữ lập trình
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#1E1E1E" }}>
              Khám phá các bài tập lập trình và thử thách code
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                img: "/python-code-editor-with-syntax-highlighting-showin.jpg",
                title: "Lập trình Python",
                desc: "Học Python qua các bài tập thực hành về cấu trúc dữ liệu, thuật toán và ứng dụng thực tế. Nội dung chi tiết sẽ được bổ sung sau.",
                badge: "Python",
              },
              {
                img: "/javascript-code-with-colorful-syntax-highlighting-.jpg",
                title: "JavaScript",
                desc: "Thành thạo JavaScript với các bài tập tương tác về ES6+, lập trình bất đồng bộ và thao tác DOM. Nội dung chi tiết sẽ được bổ sung sau.",
                badge: "JavaScript",
              },
              {
                img: "/java-code-showing-class-structure-and-object-orien.jpg",
                title: "Phát triển Java",
                desc: "Tìm hiểu Java với các bài tập về OOP, cấu trúc dữ liệu và phát triển ứng dụng doanh nghiệp. Nội dung chi tiết sẽ được bổ sung sau.",
                badge: "Java",
              },
              {
                img: "/sql-query-editor-showing-database-tables-and-selec.jpg",
                title: "SQL & Cơ sở dữ liệu",
                desc: "Thực hành các câu truy vấn SQL, thiết kế cơ sở dữ liệu và làm việc hiệu quả với cơ sở dữ liệu quan hệ. Nội dung chi tiết sẽ được bổ sung sau.",
                badge: "SQL",
              },
            ].map((item, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-lg transition-all border-2"
                style={{ backgroundColor: "#F5F7FA", borderColor: "#C9A24D" }}
              >
                <div className="relative aspect-video overflow-hidden" style={{ backgroundColor: "#1E1E1E" }}>
                  <img src={item.img || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" />
                  <div
                    className="absolute top-3 right-3 px-3 py-1 rounded-full font-mono text-sm font-semibold"
                    style={{ backgroundColor: "#C9A24D", color: "#FFFFFF" }}
                  >
                    {item.badge}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-3 font-mono" style={{ color: "#1F4E79" }}>
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#1E1E1E" }}>
                    {item.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4" style={{ backgroundColor: "#1F4E79" }}>
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, #C9A24D 0%, #FFFFFF 50%, #C9A24D 100%)` }}
        />

        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-lg font-bold mb-4 text-white font-mono">
                <span style={{ color: "#C9A24D" }}>{"<"}</span>Edu-ACAS<span style={{ color: "#C9A24D" }}>{"/>"}</span>
              </h4>
              <p className="text-white opacity-80 text-sm">
                Nền tảng học lập trình qua các bài tập tương tác và thử thách code.
              </p>
            </div>
            <div>
              <h4 className="text-base font-bold mb-4 text-white">Ngôn ngữ</h4>
              <ul className="space-y-2 text-white opacity-80 text-sm">
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → Python
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → JavaScript
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → Java
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → SQL
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-bold mb-4 text-white">Hỗ trợ</h4>
              <ul className="space-y-2 text-white opacity-80 text-sm">
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → Tài liệu
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → Hướng dẫn
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → Liên hệ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-bold mb-4 text-white">Giới thiệu</h4>
              <ul className="space-y-2 text-white opacity-80 text-sm">
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → Về chúng tôi
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → Cộng đồng
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-6 text-center" style={{ borderColor: "rgba(201, 162, 77, 0.3)" }}>
            <p className="text-white opacity-70 text-sm">© 2025 Edu-ACAS. Nền tảng học lập trình chuyên nghiệp.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
