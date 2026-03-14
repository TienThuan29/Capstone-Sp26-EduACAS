import Image from "next/image"

export default function Footer() {
  return (
    <footer
      id="contact"
      className="py-12 px-4 relative min-h-[400px] bg-[#1F4E79] dark:bg-gray-900"
      style={{
        backgroundImage: 'url(/footer.png)',
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
                src="/images/Edu-ACAS logo.png" 
                alt="Edu-ACAS Logo" 
                width={80}
                height={80}
                className="h-20 w-auto" 
              />
            </div>
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
                  → About us
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
          <p className="text-white opacity-70 text-sm">© 2025 Edu-ACAS. Professional programming learning platform.</p>
        </div>
      </div>
    </footer>
  )
}