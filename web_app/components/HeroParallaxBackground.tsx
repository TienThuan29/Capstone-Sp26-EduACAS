"use client"

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import Image from "next/image"
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion"
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline"
import { useThemeContext } from "@/components/theme-provider"

function subscribeHtmlDark(cb: () => void) {
  const el = document.documentElement
  const mo = new MutationObserver(cb)
  mo.observe(el, { attributes: true, attributeFilter: ["class"] })
  return () => mo.disconnect()
}

function getHtmlDarkSnapshot() {
  return document.documentElement.classList.contains("dark")
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type HeroAppearance = "light" | "dark" | "auto"

export interface HeroParallaxBackgroundProps {
  title: string
  subtitle?: string
  ctaLabel?: string
  ctaHref?: string
  secondaryCta?: {
    label: string
    href: string
  }
  stats?: Array<{ number: string; label: string }>
  children?: ReactNode
  minParallaxPx?: number
  maxParallaxPx?: number
  /** Visual theme: follow global app theme, or force light / dark */
  appearance?: HeroAppearance
  /** Sun/moon control (uses ThemeProvider + html.dark) */
  showThemeToggle?: boolean
  className?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating icons — real SVG logos from /public/language-img/
// ─────────────────────────────────────────────────────────────────────────────

// All 12 SVG files + key languages duplicated for density.
// `id` doubles as React key — must be unique per entry.
const LANG_FLOATERS = [
  { id: "python",     src: "/language-img/icons8-python.svg"              },
  { id: "python-2",   src: "/language-img/icons8-python.svg"              }, // small, far
  { id: "javascript", src: "/language-img/icons8-javascript.svg"          },
  { id: "javascript-2",src: "/language-img/icons8-javascript.svg"       }, // small, far
  { id: "typescript", src: "/language-img/icons8-typescript.svg"          },
  { id: "typescript-2",src: "/language-img/icons8-typescript.svg"        }, // small, far
  { id: "java",       src: "/language-img/icons8-java.svg"                },
  { id: "csharp",     src: "/language-img/icons8-cs.svg"                 },
  { id: "cpp",        src: "/language-img/icons8-cpp.svg"                },
  { id: "c",          src: "/language-img/icons8-c.svg"                  },
  { id: "html",       src: "/language-img/icons8-html.svg"               },
  { id: "css",        src: "/language-img/icons8-css3.svg"              },
  { id: "tailwind",   src: "/language-img/icons8-tailwind-css.svg"       },
  { id: "vscode",     src: "/language-img/icons8-visual-studio-code-2019.svg" },
  { id: "vs",         src: "/language-img/icons8-visual-studio.svg"      },
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Floating layer — parallax in pixels (was wrongly ×100 → massive GPU smear)
// ─────────────────────────────────────────────────────────────────────────────

interface FloatingLogoProps {
  src: string
  initialX: number
  initialY: number
  initialScale: number
  initialOpacity: number
  depthMultiplier: number
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
  containerWidth: number
  containerHeight: number
}

function FloatingLogo({
  src,
  initialX,
  initialY,
  initialScale,
  initialOpacity,
  depthMultiplier,
  mouseX,
  mouseY,
  containerWidth,
  containerHeight,
}: FloatingLogoProps) {
  const elX = useTransform(mouseX, [0, containerWidth], [-1, 1])
  const elY = useTransform(mouseY, [0, containerHeight], [-1, 1])

  const rawX = useTransform(elX, (x: number) => -x * depthMultiplier)
  const rawY = useTransform(elY, (y: number) => -y * depthMultiplier)

  const springConfig = { stiffness: 50, damping: 28, mass: 0.65 }
  const x = useSpring(rawX, springConfig)
  const y = useSpring(rawY, springConfig)

  // All SVGs use viewBox="0 0 48 48" → base size 48px
  const size = Math.round(36 + initialScale * 48)

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{
        left: `${initialX}%`,
        top: `${initialY}%`,
        width: size,
        height: size,
        x,
        y,
        opacity: initialOpacity,
        transformOrigin: "50% 50%",
        backfaceVisibility: "hidden",
      }}
      aria-hidden
    >
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className="block"
        style={{ width: size, height: size }}
        unoptimized
      />
    </motion.div>
  )
}

function heroTokens(isDark: boolean) {
  if (isDark) {
    return {
      sectionBg: "#0b0e14",
      baseGradient:
        "radial-gradient(ellipse 120% 80% at 50% 120%, #2a0a0a 0%, #130808 35%, #0b0e14 70%)",
      redGlow:
        "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(180,30,30,0.18) 0%, transparent 65%)",
      blueGlow:
        "radial-gradient(ellipse 60% 40% at 50% 80%, rgba(31,78,121,0.08) 0%, transparent 70%)",
      subtitle: "rgba(255,255,255,0.62)",
      statLabel: "rgba(255,255,255,0.45)",
      secondaryBtn: {
        border: "1px solid rgba(255,255,255,0.18)",
        color: "rgba(255,255,255,0.78)",
      },
      bottomFade: "linear-gradient(to bottom, transparent, #0b0e14)",
      badge: {
        background: "rgba(201,162,77,0.12)",
        border: "1px solid rgba(201,162,77,0.3)",
        color: "#C9A24D",
      },
      dotClass: "bg-[#C9A24D]",
    }
  }
  return {
    sectionBg: "#f3f5f9",
    baseGradient:
      "radial-gradient(ellipse 110% 85% at 50% 115%, #fef6e8 0%, #eef2f8 45%, #f3f5f9 72%)",
    redGlow:
      "radial-gradient(ellipse 75% 55% at 50% 100%, rgba(201,162,77,0.14) 0%, transparent 62%)",
    blueGlow:
      "radial-gradient(ellipse 55% 38% at 50% 78%, rgba(31,78,121,0.07) 0%, transparent 70%)",
    subtitle: "rgba(30,30,30,0.72)",
    statLabel: "rgba(30,30,30,0.52)",
    secondaryBtn: {
      border: "1px solid rgba(31,78,121,0.22)",
      color: "#1F4E79",
    },
    bottomFade: "linear-gradient(to bottom, transparent, #f3f5f9)",
    badge: {
      background: "rgba(31,78,121,0.08)",
      border: "1px solid rgba(31,78,121,0.2)",
      color: "#1F4E79",
    },
    dotClass: "bg-[#1F4E79]",
  }
}

function parseTitleParts(title: string) {
  const i = title.indexOf("-")
  if (i === -1) return { first: title, rest: "" }
  return { first: title.slice(0, i), rest: title.slice(i) }
}

export default function HeroParallaxBackground({
  title,
  subtitle,
  ctaLabel = "Get started",
  ctaHref = "/login",
  secondaryCta,
  stats,
  children,
  minParallaxPx = 6,
  maxParallaxPx = 28,
  appearance = "auto",
  showThemeToggle = false,
  className = "",
}: HeroParallaxBackgroundProps) {
  const { toggleTheme } = useThemeContext()
  const htmlDark = useSyncExternalStore(
    subscribeHtmlDark,
    getHtmlDarkSnapshot,
    () => false,
  )
  const sectionRef = useRef<HTMLElement>(null)
  const [containerSize, setContainerSize] = useState({ w: 1200, h: 800 })

  const isDark = appearance === "auto" ? htmlDark : appearance === "dark"

  const tokens = heroTokens(isDark)
  const { first: titleFirst, rest: titleRest } = parseTitleParts(title)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerSize({
          w: Math.max(1, entry.contentRect.width),
          h: Math.max(1, entry.contentRect.height),
        })
      }
    })
    ro.observe(el)
    setContainerSize({
      w: Math.max(1, el.offsetWidth),
      h: Math.max(1, el.offsetHeight),
    })
    return () => ro.disconnect()
  }, [])

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    },
    [mouseX, mouseY],
  )

  const seededRand = (seed: number, min: number, max: number) => {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
    return min + (x - Math.floor(x)) * (max - min)
  }

  const logoStates = LANG_FLOATERS.map((item, i) => {
    const rawScale = seededRand(i * 3, 0.45, 1.05)
    const depthMultiplier =
      minParallaxPx +
      ((rawScale - 0.45) / 0.6) * (maxParallaxPx - minParallaxPx)
    return {
      id: item.id,
      src: item.src,
      initialX: seededRand(i * 3 + 1, 2, 86),
      initialY: seededRand(i * 3 + 2, 2, 86),
      initialScale: rawScale,
      initialOpacity: seededRand(i * 3 + 3, 0.14, 0.42),
      depthMultiplier,
    }
  })

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className={`relative min-h-screen w-full overflow-hidden ${className}`}
      style={{ background: tokens.sectionBg }}
    >
      {showThemeToggle && (
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute right-4 top-20 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white shadow-md backdrop-blur-md dark:border-white/20 dark:bg-white/10 md:right-8 md:top-24"
          style={
            !isDark
              ? {
                  borderColor: "rgba(31,78,121,0.2)",
                  background: "rgba(255,255,255,0.85)",
                  color: "#1F4E79",
                }
              : undefined
          }
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </button>
      )}

      <div
        className="absolute inset-0"
        style={{ background: tokens.baseGradient }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: tokens.redGlow }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: tokens.blueGlow }}
      />

      {logoStates.map(
        ({
          id,
          src,
          initialX,
          initialY,
          initialScale,
          initialOpacity,
          depthMultiplier,
        }) => (
          <FloatingLogo
            key={id}
            src={src}
            initialX={initialX}
            initialY={initialY}
            initialScale={initialScale}
            initialOpacity={initialOpacity}
            depthMultiplier={depthMultiplier}
            mouseX={mouseX}
            mouseY={mouseY}
            containerWidth={containerSize.w}
            containerHeight={containerSize.h}
          />
        ),
      )}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="container mx-auto max-w-5xl space-y-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold"
            style={{
              background: tokens.badge.background,
              border: tokens.badge.border,
              color: tokens.badge.color,
            }}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full animate-pulse ${tokens.dotClass}`}
            />
            E-LEARNING PLATFORM
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="text-5xl font-bold tracking-tight md:text-7xl"
          >
            <span style={{ color: "#1F4E79" }}>{titleFirst}</span>
            {titleRest ? (
              <span style={{ color: "#C9A24D" }}>{titleRest}</span>
            ) : null}
          </motion.h1>

          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
              className="mx-auto max-w-2xl text-lg md:text-xl"
              style={{ color: tokens.subtitle }}
            >
              {subtitle}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <a
              href={ctaHref}
              className="group relative inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{ backgroundColor: "#1F4E79" }}
            >
              <span
                className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)",
                }}
              />
              <span className="relative">{ctaLabel}</span>
              <span className="relative text-lg transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </a>

            {secondaryCta && (
              <a
                href={secondaryCta.href}
                className="inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-semibold transition-all duration-300 hover:underline"
                style={{
                  border: tokens.secondaryBtn.border,
                  color: tokens.secondaryBtn.color,
                }}
              >
                {secondaryCta.label}
              </a>
            )}
          </motion.div>

          {stats && stats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.4 }}
              className="mx-auto grid max-w-lg grid-cols-3 gap-6 pt-4"
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div
                    className="font-mono text-3xl font-bold"
                    style={{ color: "#C9A24D" }}
                  >
                    {stat.number}
                  </div>
                  <div
                    className="mt-1 text-sm"
                    style={{ color: tokens.statLabel }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {children}
        </div>
      </div>

      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{ background: tokens.bottomFade }}
      />
    </section>
  )
}
