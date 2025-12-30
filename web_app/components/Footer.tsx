export default function Footer() {
  return (
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
  )
}