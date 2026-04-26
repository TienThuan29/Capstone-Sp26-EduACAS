"use client"

import { Card } from "flowbite-react"
import Image from "next/image"
import { LOGO_EDU_ACAS, PLACEHOLDER, PYTHON_CODE_IMG, JAVASCRIPT_CODE_IMG, JAVA_CODE_IMG, SQL_CODE_IMG } from "@/assets/images"

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
                    src={LOGO_EDU_ACAS}
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
                  E-Learning Platform
                  <br />
                  <span style={{ color: "#C9A24D" }}>Professional Programming</span>
                </h2>
                <p className="text-lg opacity-80" style={{ color: "#1E1E1E" }}>
                  Connecting lecturers and students for teaching, learning, and practicing programming languages
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  className="px-10 py-4 rounded-lg text-white font-bold text-lg hover:scale-105 transition-transform"
                  style={{ backgroundColor: "#1F4E79" }}
                >
                  Get Started →
                </button>
                <span className="font-mono text-sm opacity-60" style={{ color: "#1F4E79" }}>
                  {"// Free to join"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6">
                {[
                  { number: "4+", label: "Languages" },
                  { number: "∞", label: "Exercises" },
                  { number: "24/7", label: "Support" },
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
              KEY FEATURES
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#1F4E79" }}>
              Featured Features
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#1E1E1E" }}>
              Everything you need for teaching and learning programming
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <UsersIcon />,
                title: "Classroom Management",
                description:
                  "Lecturers can easily create and manage classrooms, add students to classes. More details will be added soon.",
              },
              {
                icon: <BookOpenIcon />,
                title: "Learning Materials",
                description:
                  "Share documents, lecture slides, and learning resources with students. More details will be added soon.",
              },
              {
                icon: <ClipboardIcon />,
                title: "Assignment Management",
                description:
                  "Lecturers create and assign programming assignments to students. More details will be added soon.",
              },
              {
                icon: <FileCodeIcon />,
                title: "Online Submission",
                description:
                  "Students submit code assignments directly on the platform. More details will be added soon.",
              },
              {
                icon: <CheckCircleIcon />,
                title: "Auto Grading",
                description:
                  "The system automatically checks and grades student assignments. More details will be added soon.",
              },
              {
                icon: <BarChartIcon />,
                title: "Progress Tracking",
                description:
                  "Lecturers track the learning progress of each student. More details will be added soon.",
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
              STATISTICS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#1F4E79" }}>
              Our Community
            </h2>
            <p className="text-lg" style={{ color: "#1E1E1E" }}>
              Join the growing platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: "0", label: "Active Students", sublabel: "No users yet" },
              { number: "0", label: "Lecturers", sublabel: "No users yet" },
              { number: "0", label: "Classrooms", sublabel: "No users yet" },
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
              PROGRAMMING LANGUAGES
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#1F4E79" }}>
              Programming Languages
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#1E1E1E" }}>
              Explore programming exercises and code challenges
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                img: PYTHON_CODE_IMG,
                title: "Python Programming",
                desc: "Learn Python through practical exercises on data structures, algorithms, and real-world applications. More details will be added soon.",
                badge: "Python",
              },
              {
                img: JAVASCRIPT_CODE_IMG,
                title: "JavaScript",
                desc: "Master JavaScript with interactive exercises on ES6+, asynchronous programming, and DOM manipulation. More details will be added soon.",
                badge: "JavaScript",
              },
              {
                img: JAVA_CODE_IMG,
                title: "Java Development",
                desc: "Explore Java with exercises on OOP, data structures, and enterprise application development. More details will be added soon.",
                badge: "Java",
              },
              {
                img: SQL_CODE_IMG,
                title: "SQL & Databases",
                desc: "Practice SQL queries, design databases, and work effectively with relational databases. More details will be added soon.",
                badge: "SQL",
              },
            ].map((item, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-lg transition-all border-2"
                style={{ backgroundColor: "#F5F7FA", borderColor: "#C9A24D" }}
              >
                <div className="relative aspect-video overflow-hidden" style={{ backgroundColor: "#1E1E1E" }}>
                  <img src={item.img || PLACEHOLDER} alt={item.title} className="w-full h-full object-cover" />
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
                  A platform for learning programming through interactive exercises and code challenges.
                </p>
            </div>
            <div>
              <h4 className="text-base font-bold mb-4 text-white">Languages</h4>
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
              <h4 className="text-base font-bold mb-4 text-white">Support</h4>
              <ul className="space-y-2 text-white opacity-80 text-sm">
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → Guides
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-bold mb-4 text-white">About</h4>
              <ul className="space-y-2 text-white opacity-80 text-sm">
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    → Community
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-6 text-center" style={{ borderColor: "rgba(201, 162, 77, 0.3)" }}>
            <p className="text-white opacity-70 text-sm">© 2025 Edu-ACAS. Professional Programming Learning Platform.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
