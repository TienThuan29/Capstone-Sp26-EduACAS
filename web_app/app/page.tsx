"use client"

import { useEffect, useState } from "react"
import { Card } from "flowbite-react"
import {
  LaptopIcon,
  SparklesIcon,
  ChartStatsIcon,
} from "@/components/svg-icons"
import { features, programmingLanguages } from "@/MockData/landingPageData"
import Footer from "@/components/footer"
import HomeNavbar from "@/components/navbar"
import HeroParallaxBackground from "@/components/HeroParallaxBackground"
import { PLACEHOLDER } from "@/assets/images"
import { usePublicStatistics } from "@/hooks/public-statistics/usePublicStatistics"
import type { PublicStatistics } from "@/types/public-statistics"
import { PageUrl } from "@/configs/page.url"

const heroStats = [
  { number: "4+", label: "Languages" },
  { number: "∞", label: "Exercises" },
  { number: "24/7", label: "Support" },
]

export default function Home() {
  const { getPublicStatistics } = usePublicStatistics()
  const [stats, setStats] = useState<PublicStatistics | null>(null)

  useEffect(() => {
    getPublicStatistics()
      .then(setStats)
      .catch(() => {
        // silently fail — keep showing fallback numbers from heroStats
      })
  }, [getPublicStatistics])

  const communityStats = [
    {
      number: stats ? String(stats.totalStudents) : "—",
      label: "Active students",
      sublabel: "Learning on the platform",
    },
    {
      number: stats ? String(stats.totalLecturers) : "—",
      label: "Lecturers",
      sublabel: "Teaching on the platform",
    },
    {
      number: stats ? String(stats.totalClassrooms) : "—",
      label: "Classrooms",
      sublabel: "Active on the platform",
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navbar */}
      <HomeNavbar />

      {/* Hero Section — 2.5D Parallax Floating Background */}
      <HeroParallaxBackground
        title="Edu-ACAS"
        subtitle="Connecting lecturers and students in teaching, learning, and practicing programming languages"
        ctaLabel="Get started"
        ctaHref={PageUrl.LOGIN_PAGE}
        secondaryCta={{ label: "Explore platform →", href: "/login" }}
        stats={heroStats}
        appearance="auto"
      />

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 mb-3 px-5 py-2 rounded-full text-sm font-semibold bg-[#F5F7FA] dark:bg-gray-700 text-[#C9A24D]"
            >
              <SparklesIcon /> FEATURED
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#1F4E79] dark:text-[#C9A24D]">
              Featured features
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-[#1E1E1E] dark:text-gray-300">
              Everything you need for programming teaching and learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
              <Card
                key={index}
                className="hover:shadow-lg transition-all border-2 bg-[#F5F7FA] dark:bg-gray-800"
                style={{ borderColor: "#C9A24D" }}
              >
                <div className="p-6 text-center space-y-4">
                  <div
                    className="inline-block p-4 rounded-xl bg-white dark:bg-gray-700"
                    style={{ border: "2px solid #C9A24D" }}
                  >
                    <IconComponent />
                  </div>
                  <h3 className="text-xl font-bold text-[#1F4E79] dark:text-[#C9A24D]">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#1E1E1E] dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              </Card>
            )
            })}
          </div>
        </div>
      </section>

      {/* Users Section */}
      <section id="about" className="py-20 px-4 bg-[#F5F7FA] dark:bg-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 mb-3 px-5 py-2 rounded-full text-sm font-semibold bg-white dark:bg-gray-700 text-[#1F4E79] dark:text-[#C9A24D]"
            >
              <ChartStatsIcon /> STATISTICS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#1F4E79] dark:text-[#C9A24D]">
              Our community
            </h2>
            <p className="text-lg text-[#1E1E1E] dark:text-gray-300">
              Join our growing platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {communityStats.map((stat, index) => (
              <Card
                key={index}
                className="text-center p-8 hover:shadow-lg transition-all border-2 bg-white dark:bg-gray-700"
                style={{ borderColor: "#C9A24D" }}
              >
                <div className="font-mono text-6xl font-bold mb-3" style={{ color: "#C9A24D" }}>
                  {stat.number}
                </div>
                <p className="text-xl font-semibold mb-1 text-[#1F4E79] dark:text-[#C9A24D]">
                  {stat.label}
                </p>
                <p className="text-sm opacity-60 text-[#1E1E1E] dark:text-gray-300">
                  {stat.sublabel}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section id="languages" className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 mb-3 px-5 py-2 rounded-full text-sm font-semibold bg-[#F5F7FA] dark:bg-gray-700 text-[#C9A24D]"
            >
              <LaptopIcon /> PROGRAMMING LANGUAGES
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#1F4E79] dark:text-[#C9A24D]">
              Programming languages
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-[#1E1E1E] dark:text-gray-300">
              Explore programming exercises and code challenges
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {programmingLanguages.map((item, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-lg transition-all border-2 bg-[#F5F7FA] dark:bg-gray-800"
                style={{ borderColor: "#C9A24D" }}
              >
                <div className="relative aspect-video overflow-hidden bg-[#1E1E1E] dark:bg-gray-900">
                  <img src={item.img || PLACEHOLDER} alt={item.title} className="w-full h-full object-cover" />
                  <div
                    className="absolute top-3 right-3 px-3 py-1 rounded-full font-mono text-sm font-semibold"
                    style={{ backgroundColor: "#C9A24D", color: "#FFFFFF" }}
                  >
                    {item.badge}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-3 font-mono text-[#1F4E79] dark:text-[#C9A24D]">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#1E1E1E] dark:text-gray-300">
                    {item.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
