import Image from "next/image"
import { ArrowRightIcon } from "@heroicons/react/24/outline"
import { FOOTER_BG, LOGO_EDU_ACAS } from "@/assets/images"

export default function Footer() {
  return (
    <footer
      id="contact"
      className="py-12 px-4 relative min-h-[400px] bg-[#1F4E79] dark:bg-gray-900"
      style={{
        backgroundImage: `url(${FOOTER_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'local',
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-[#1F4E79]/70 dark:bg-gray-900/60"></div>
      
      <div
        className="absolute top-0 left-0 right-0 h-1 z-20"
        style={{ background: `linear-gradient(90deg, #C9A24D 0%, #FFFFFF 50%, #C9A24D 100%)` }}
      />

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="mb-4 inline-block p-3 rounded-lg bg-white dark:bg-transparent">
              <Image 
                src={LOGO_EDU_ACAS} 
                alt="Edu-ACAS Logo" 
                width={80}
                height={80}
                className="h-20 w-auto" 
              />
            </div>
            <p className="text-white opacity-80 text-sm">
              A system for learning programming through interactive exercises and code challenges.
            </p>
          </div>
          <div>
            <h4 className="text-base font-bold mb-4 text-white">Languages</h4>
            <ul className="space-y-2 text-white opacity-80 text-sm">
              <li>
                <a href="#" className="hover:opacity-100 transition-opacity flex items-center gap-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  <span>Python</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100 transition-opacity flex items-center gap-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  <span>JavaScript</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100 transition-opacity flex items-center gap-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  <span>Java</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100 transition-opacity flex items-center gap-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  <span>SQL</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-base font-bold mb-4 text-white">Support</h4>
            <ul className="space-y-2 text-white opacity-80 text-sm">
              <li>
                <a href="#" className="hover:opacity-100 transition-opacity flex items-center gap-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  <span>Documentation</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100 transition-opacity flex items-center gap-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  <span>Guides</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100 transition-opacity flex items-center gap-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  <span>FAQ</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100 transition-opacity flex items-center gap-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  <span>Contact</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-base font-bold mb-4 text-white">About</h4>
            <ul className="space-y-2 text-white opacity-80 text-sm">
              <li>
                <a href="#" className="hover:opacity-100 transition-opacity flex items-center gap-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  <span>About us</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100 transition-opacity flex items-center gap-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  <span>Blog</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100 transition-opacity flex items-center gap-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  <span>Community</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-6 text-center" style={{ borderColor: "rgba(201, 162, 77, 0.3)" }}>
          <p className="text-white opacity-70 text-sm">© 2025 Edu-ACAS. Professional programming learning system.</p>
        </div>
      </div>
    </footer>
  )
}