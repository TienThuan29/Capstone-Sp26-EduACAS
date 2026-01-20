"use client"

import { useState, useEffect, useCallback } from "react"

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const slides = [
    {
      src: "/hero-slide-images/code-1.jpg",
      alt: "Code background 1",
      gradient: "linear-gradient(135deg, rgba(31, 78, 121, 0.7) 0%, rgba(201, 162, 77, 0.5) 100%)",
    },
    {
      src: "/hero-slide-images/code-2.jpg",
      alt: "Code background 2",
      gradient: "linear-gradient(135deg, rgba(201, 162, 77, 0.6) 0%, rgba(31, 78, 121, 0.6) 100%)",
    },
    {
      src: "/hero-slide-images/code-3.jpg",
      alt: "Code background 3",
      gradient: "linear-gradient(135deg, rgba(31, 78, 121, 0.65) 0%, rgba(201, 162, 77, 0.55) 100%)",
    },
  ]

  const nextSlide = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true)
      setCurrentSlide((prev) => (prev + 1) % slides.length)
      setTimeout(() => setIsTransitioning(false), 1000)
    }
  }, [isTransitioning, slides.length])

  const goToSlide = (index: number) => {
    if (!isTransitioning && index !== currentSlide) {
      setIsTransitioning(true)
      setCurrentSlide(index)
      setTimeout(() => setIsTransitioning(false), 1000)
    }
  }

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(nextSlide, 6000)
    return () => clearInterval(interval)
  }, [nextSlide])

  return (
    <div className="absolute inset-0 overflow-hidden opacity-20 dark:opacity-15">
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{
              transitionDelay: index === currentSlide ? '0ms' : '0ms',
            }}
          >
            {/* Image with smooth loading */}
            <div className="relative w-full h-full">
              <img
                src={slide.src}
                alt={slide.alt}
                className="w-full h-full object-cover transform scale-105 animate-ken-burns"
                loading="lazy"
              />
              {/* Gradient Overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: slide.gradient,
                  mixBlendMode: "multiply",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 w-3 rounded-full transition-all duration-300 ease-in-out ${
              index === currentSlide
                ? 'bg-white dark:bg-gray-800 scale-110'
                : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 hover:scale-105'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* CSS for Ken Burns effect */}
      <style jsx>{`
        @keyframes ken-burns {
          0% {
            transform: scale(1) translate(0, 0);
          }
          50% {
            transform: scale(1.05) translate(-2%, -2%);
          }
          100% {
            transform: scale(1) translate(0, 0);
          }
        }

        .animate-ken-burns {
          animation: ken-burns 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
