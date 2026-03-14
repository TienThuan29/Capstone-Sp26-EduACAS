"use client"

import { Card } from "flowbite-react"
import HomeNavbar from "@/components/navbar"
import Footer from "@/components/footer"
import {
  LaptopIcon,
  GraduateIcon,
  SparklesIcon,
} from "@/components/svg-icons"
import Image from "next/image"

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HomeNavbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-[#F5F7FA] to-white dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto max-w-7xl text-center">
          <div
            className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full text-sm font-semibold bg-white dark:bg-gray-700 text-[#1F4E79] dark:text-[#C9A24D]"
          >
            <GraduateIcon /> ABOUT US
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-[#1F4E79] dark:text-white">About </span>
            <span className="text-[#C9A24D]">Edu-ACAS</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            A modern programming learning platform connecting instructors and students in teaching, learning, and practicing programming languages
          </p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Logo Display */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <div
                  className="absolute inset-0 rounded-2xl blur-2xl opacity-30 animate-pulse"
                  style={{ background: 'linear-gradient(135deg, #1F4E79 0%, #C9A24D 100%)' }}
                />
                <div
                  className="relative p-8 rounded-2xl bg-white dark:bg-gray-800 transform hover:scale-105 transition-transform duration-300"
                  style={{ border: "3px solid #C9A24D" }}
                >
                  <Image
                    src="/images/Edu-ACAS logo.png"
                    alt="Edu-ACAS Logo"
                    width={400}
                    height={400}
                    className="rounded-xl w-full"
                  />
                  <div
                    className="absolute -top-4 -left-4 text-4xl font-mono font-bold"
                    style={{ color: "#1F4E79" }}
                  >
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

            {/* Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-4">
                  Our Mission
                </h2>
                <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                  Edu-ACAS is built with the mission to deliver the best programming learning experience for students and effective teaching tools for instructors. We believe that learning to code should be practiced in a professional environment with the right tools.
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-4">
                  Vision
                </h2>
                <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                  To become the leading E-Learning platform for programming teaching and learning in Vietnam, helping students develop coding skills and prepare well for their careers.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <Card className="p-6 text-center border-2 hover:shadow-lg transition-all" style={{ borderColor: "#C9A24D" }}>
                  <div className="text-4xl font-bold text-[#C9A24D] mb-2">100+</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">Programming exercises</div>
                </Card>
                <Card className="p-6 text-center border-2 hover:shadow-lg transition-all" style={{ borderColor: "#1F4E79" }}>
                  <div className="text-4xl font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-2">24/7</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">Learning support</div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 bg-[#F5F7FA] dark:bg-gray-800">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-4">
              Core Values
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              The values that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center border-2 hover:shadow-lg transition-all bg-white dark:bg-gray-700" style={{ borderColor: "#C9A24D" }}>
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-gray-600">
                  <LaptopIcon />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-3">
                Hands-on practice
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Write code and get instant feedback from the automated grading system, helping students learn faster
              </p>
            </Card>

            <Card className="p-8 text-center border-2 hover:shadow-lg transition-all bg-white dark:bg-gray-700" style={{ borderColor: "#C9A24D" }}>
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-gray-600">
                  <GraduateIcon />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-3">
                Professional instructors
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Guided by experienced industry instructors, ensuring teaching quality
              </p>
            </Card>

            <Card className="p-8 text-center border-2 hover:shadow-lg transition-all bg-white dark:bg-gray-700" style={{ borderColor: "#C9A24D" }}>
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-xl bg-[#F5F7FA] dark:bg-gray-600">
                  <SparklesIcon />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-3">
                Modern technology
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                The platform is built with the latest technology, ensuring the best experience for users
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1F4E79] dark:text-[#C9A24D] mb-4">
              Our Community
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Join our growing platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center border-2 hover:shadow-lg transition-all bg-[#F5F7FA] dark:bg-gray-800" style={{ borderColor: "#C9A24D" }}>
              <div className="text-6xl font-mono font-bold text-[#C9A24D] mb-3">1000+</div>
              <p className="text-xl font-semibold text-[#1F4E79] dark:text-[#C9A24D] mb-1">Students</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Learning on the platform</p>
            </Card>

            <Card className="p-8 text-center border-2 hover:shadow-lg transition-all bg-[#F5F7FA] dark:bg-gray-800" style={{ borderColor: "#C9A24D" }}>
              <div className="text-6xl font-mono font-bold text-[#C9A24D] mb-3">50+</div>
              <p className="text-xl font-semibold text-[#1F4E79] dark:text-[#C9A24D] mb-1">Instructors</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Teaching on the system</p>
            </Card>

            <Card className="p-8 text-center border-2 hover:shadow-lg transition-all bg-[#F5F7FA] dark:bg-gray-800" style={{ borderColor: "#C9A24D" }}>
              <div className="text-6xl font-mono font-bold text-[#C9A24D] mb-3">5+</div>
              <p className="text-xl font-semibold text-[#1F4E79] dark:text-[#C9A24D] mb-1">Languages</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Programming languages supported</p>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
