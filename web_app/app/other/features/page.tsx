"use client"

import { Card } from "flowbite-react"
import Link from "next/link"
import HomeNavbar from "@/components/navbar"
import Footer from "@/components/footer"
import { SparklesIcon } from "@/components/svg-icons"
import { features } from "@/MockData/landingPageData"
import { PageUrl } from "@/configs/page.url"

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HomeNavbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-[#F5F7FA] to-white dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto max-w-7xl text-center">
          <div
            className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full text-sm font-semibold bg-white dark:bg-gray-700 text-[#C9A24D]"
          >
            <SparklesIcon /> FEATURED
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-[#1F4E79] dark:text-white">Featured </span>
            <span className="text-[#C9A24D]">Features</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Everything you need for effective and professional programming teaching and learning
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
              Detailed Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Explore the powerful features of Edu-ACAS
            </p>
          </div>

          <div className="space-y-12">
            {/* Feature 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <Card className="p-8 border-2 bg-white dark:bg-gray-700" style={{ borderColor: "#C9A24D" }}>
                <div className="space-y-4">
                  <div className="inline-block px-4 py-2 rounded-full bg-[#C9A24D] text-white text-sm font-semibold">
                    FOR STUDENTS
                  </div>
                  <h3 className="text-3xl font-bold text-[#1F4E79] dark:text-[#C9A24D]">
                    Flexible learning
                  </h3>
                  <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-[#C9A24D] text-xl">✓</span>
                      <span>Access lessons and materials anytime, anywhere</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#C9A24D] text-xl">✓</span>
                      <span>Practice code directly in the browser</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#C9A24D] text-xl">✓</span>
                      <span>Get automatic and detailed feedback</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#C9A24D] text-xl">✓</span>
                      <span>Track your own learning progress</span>
                    </li>
                  </ul>
                </div>
              </Card>

              <Card className="p-8 border-2 bg-white dark:bg-gray-700" style={{ borderColor: "#1F4E79" }}>
                <div className="space-y-4">
                  <div className="inline-block px-4 py-2 rounded-full bg-[#1F4E79] text-white text-sm font-semibold">
                    FOR LECTURERS
                  </div>
                  <h3 className="text-3xl font-bold text-[#1F4E79] dark:text-[#C9A24D]">
                    Effective management
                  </h3>
                  <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-[#1F4E79] dark:text-[#C9A24D] text-xl">✓</span>
                      <span>Create and manage assignments and exams easily</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#1F4E79] dark:text-[#C9A24D] text-xl">✓</span>
                      <span>Automatic grading saves time</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#1F4E79] dark:text-[#C9A24D] text-xl">✓</span>
                      <span>Track each student&apos;s progress</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#1F4E79] dark:text-[#C9A24D] text-xl">✓</span>
                      <span>Detailed reports and statistics</span>
                    </li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Feature 2 */}
            <Card className="p-12 border-2 bg-white dark:bg-gray-700" style={{ borderColor: "#C9A24D" }}>
              <div className="text-center space-y-6">
                <h3 className="text-3xl font-bold text-[#1F4E79] dark:text-[#C9A24D]">
                  Automatic grading system
                </h3>
                <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                  Uses AI technology and advanced algorithms to grade code automatically, providing detailed feedback on syntax, logic, performance, and code optimization
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
                  <div>
                    <div className="text-4xl font-bold text-[#C9A24D] mb-2">100%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Automatic</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-[#C9A24D] mb-2">&lt;1s</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Grading time</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-[#C9A24D] mb-2">24/7</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Available</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-[#C9A24D] mb-2">∞</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Attempts</div>
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
            Ready to try it?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start learning programming today with Edu-ACAS
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* <Link
              href={PageUrl.REGISTER_PAGE}
              className="px-8 py-4 bg-white text-[#1F4E79] rounded-lg font-bold text-lg hover:scale-105 transition-all"
            >
              Sign up now
            </Link> */}
            <Link
              href={PageUrl.HOME_PAGE}
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-bold text-lg hover:scale-105 transition-all"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
