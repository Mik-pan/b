import Link from "next/link";
// home.css and base.css are globally imported, so we just need about.css for specific content styles
// But we need to ensure about.css doesn't conflict. 
// We will rely on global class names for layout.

export const metadata = {
  title: "关于 | CODE_SPACE",
  description: "关于 CODE_SPACE 数字军火库",
};

const brand = "CODE_SPACE";
const navItems = [
  { label: "[01] 首页 / Home", href: "/" },
  { label: "[02] 关于 / About", href: "/about" },
  { label: "[03] 订阅 / Subscribe", href: "/subscribe" },
  { label: "[04] 贡献 / Contribute", href: "/contribute" },
];

export default function AboutPage() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div>
          <Link href="/" className="brand">
            {brand}
          </Link>
          <nav>
            <ul className="nav-menu">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="status-box">
          <div className="status-item">
            <span>STATUS:</span>
            <span style={{ color: "green" }}>● ONLINE</span>
          </div>
          <div className="status-item">
            <span>TYPE:</span>
            <span>LIBRARY</span>
          </div>
          <div className="status-item">
            <span>THEME:</span>
            <span>RAW_V1.0</span>
          </div>
        </div>
      </aside>

      <main className="main-content about-container">
        <section className="about-hero">
          <h1>BLUEPRINT ARCHIVE</h1>
          <p>&gt; 开发者的高阶代码军火库。</p>
        </section>

        <div className="content-grid">
          <section className="about-section">
            <h2>01. The Mission</h2>
            <div className="text-block">
              <p>
                <strong>CODE_SPACE</strong> 并非传统的个人博客，而是一个面向专业开发者的<strong>代码资产库</strong>。
                我们致力于弥合「Hello World」教程与「生产级应用」之间的巨大鸿沟。
              </p>
              <p>
                在这里，你不会看到零碎的知识点拼凑，而是完整的、经过架构设计的、可直接用于商业项目的解决方案。
                我们提供的是工程师手中的武器——高质量的源码，助你在项目中快速突围。
              </p>
            </div>
          </section>

          <section className="about-section">
            <h2>02. Standards</h2>
            <div className="text-block">
              <p>我们对收录的代码有着近乎苛刻的工业级标准：</p>
              <ul style={{ listStyle: "none", paddingLeft: 0, marginTop: "20px" }}>
                <li style={{ marginBottom: "15px", display: 'flex', gap: '10px' }}>
                  <span style={{ color: "var(--accent-color)", fontWeight: "bold" }}>A.</span>
                  <span><strong>Type-Safe:</strong> 全面拥抱强类型系统，杜绝 implicit any，确保大型项目的可维护性。</span>
                </li>
                <li style={{ marginBottom: "15px", display: 'flex', gap: '10px' }}>
                  <span style={{ color: "var(--accent-color)", fontWeight: "bold" }}>B.</span>
                  <span><strong>Modular:</strong> 高内聚低耦合的架构设计，组件与逻辑分离，便于移植与复用。</span>
                </li>
                <li style={{ marginBottom: "15px", display: 'flex', gap: '10px' }}>
                  <span style={{ color: "var(--accent-color)", fontWeight: "bold" }}>C.</span>
                  <span><strong>Aesthetic:</strong> 代码的美感不仅在于逻辑，更在于用户可感知的交互细节。</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="about-section">
            <h2>03. Domains</h2>
            <div className="tech-stack-grid">
              <div className="tech-item">
                <span className="tech-num">CORE</span>
                <span className="tech-name">System Design</span>
                <span className="tech-desc">Microservices / Architecture</span>
              </div>
              <div className="tech-item">
                <span className="tech-num">VISUAL</span>
                <span className="tech-name">Creative Coding</span>
                <span className="tech-desc">WebGL / Three.js / Shader</span>
              </div>
              <div className="tech-item">
                <span className="tech-num">APP</span>
                <span className="tech-name">Full Stack</span>
                <span className="tech-desc">Next.js / Rust / Node</span>
              </div>
              <div className="tech-item">
                <span className="tech-num">TOOL</span>
                <span className="tech-name">DevOps</span>
                <span className="tech-desc">CI/CD / Docker / K8s</span>
              </div>
            </div>
          </section>

          <section className="about-section highlight-box">
            <div className="highlight-content">
              <h2>Access The Arsenal</h2>
              <p>停止重复造轮子。获取经过实战检验的代码资产，将其整合进你的下一个独角兽项目中。</p>
              <Link href="/subscribe" className="link-arrow">
                解锁全部资产权限 →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
