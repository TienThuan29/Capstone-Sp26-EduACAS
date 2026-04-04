"use client"

import { Card } from "flowbite-react"
import {
  LaptopIcon,
  SparklesIcon,
  ChartStatsIcon,
} from "@/components/svg-icons"
import { features, communityStats, programmingLanguages } from "@/MockData/landingPageData"
import Footer from "@/components/footer"
import HomeNavbar from "@/components/navbar"
import HeroParallaxBackground from "@/components/HeroParallaxBackground"
import { PLACEHOLDER } from "@/assets/images"

const heroStats = [
  { number: "4+", label: "Languages" },
  { number: "∞", label: "Exercises" },
  { number: "24/7", label: "Support" },
]

export default function Home() {

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navbar */}
      <HomeNavbar />

      {/* Hero Section */}
      {/* <section id="home" className="py-20 px-4 min-h-screen flex items-center bg-[#F5F7FA] dark:bg-gray-800 relative overflow-hidden">
        <HeroCarousel />
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <div 
                  className="absolute inset-0 rounded-2xl blur-2xl opacity-30 animate-pulse"
                  style={{ background: 'linear-gradient(135deg, #1F4E79 0%, #C9A24D 100%)' }}
                />
                
                <div
                  className="relative p-8 rounded-2xl bg-white/95 backdrop-blur-sm transform hover:scale-105 transition-transform duration-300"
                  style={{ border: "3px solid #C9A24D" }}
                >
                  <Image
                    src={LOGO_EDU_ACAS}
                    alt="Edu-ACAS Logo"
                    width={400}
                    height={400}
                    className="rounded-xl w-full"
                  />
                  
                  <div 
                    className="absolute -top-4 -left-4 text-4xl font-mono font-bold animate-pulse" 
                    style={{ color: "#1F4E79", animationDuration: '2s' }}
                  >
                    {"<"}
                  </div>
                  <div
                    className="absolute -bottom-4 -right-4 text-4xl font-mono font-bold animate-pulse"
                    style={{ color: "#C9A24D", animationDuration: '2s', animationDelay: '1s' }}
                  >
                    {"/>"}
                  </div>
                  
                  <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#C9A24D] animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-[#1F4E79] animate-ping" style={{ animationDuration: '3s', animationDelay: '1.5s' }} />
                </div>
              </div>
            </div>
        
            <div className="space-y-6">
              <div
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold animate-pulse"
                style={{ 
                  backgroundColor: "#C9A24D", 
                  color: "#FFFFFF",
                  animationDuration: '2s'
                }}
              >
                E-LEARNING PLATFORM
              </div>

              <h1 className="text-5xl md:text-6xl font-bold">
                <span className="inline-block hover:scale-110 transition-transform" style={{ color: "#1F4E79" }}>Edu</span>
                <span className="inline-block hover:scale-110 transition-transform" style={{ color: "#C9A24D" }}>-ACAS</span>
              </h1>

              <div className="space-y-3">
                <h2 className="text-3xl font-semibold" style={{ color: "#1F4E79" }}>
                  E-Learning platform
                  <br />
                  <span style={{ color: "#C9A24D" }}>Professional programming</span>
                </h2>
                <p className="text-lg opacity-80 text-[#1E1E1E] dark:text-gray-300">
                  Connecting instructors and students in teaching, learning, and practicing programming languages
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Link href="/login">
                  <button
                    className="px-10 py-4 rounded-lg text-white font-bold text-lg hover:scale-105 transition-all duration-300 hover:shadow-2xl relative overflow-hidden group"
                    style={{ backgroundColor: "#1F4E79" }}
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700" />
                    <span className="relative">Get started</span>
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6">
                {heroStats.map((stat, index) => (
                  <div 
                    key={index} 
                    className="group hover:scale-110 transition-transform duration-300 cursor-pointer"
                  >
                    <div 
                      className="text-3xl font-bold font-mono group-hover:animate-pulse" 
                      style={{ color: "#C9A24D" }}
                    >
                      {stat.number}
                    </div>
                    <div className="text-sm opacity-70 text-[#1E1E1E] dark:text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Hero Section — 2.5D Parallax Floating Background */}
      <HeroParallaxBackground
        title="Edu-ACAS"
        subtitle="Connecting instructors and students in teaching, learning, and practicing programming languages"
        ctaLabel="Get started"
        ctaHref="/login"
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
