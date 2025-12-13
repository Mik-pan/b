import Link from "next/link";
import { Navigation } from "@/components/navigation";
import "../styles/contribute.css";

export const metadata = {
    title: "贡献 & 分成 | CODE_SPACE",
    description: "提交您的原创代码，获取收益分成",
};

const brand = "CODE_SPACE";
const navItems = [
    { label: "[01] 首页 / Home", href: "/" },
    { label: "[02] 关于 / About", href: "/about" },
    { label: "[03] 订阅 / Subscribe", href: "/subscribe" },
    { label: "[04] 贡献 / Contribute", href: "/contribute" },
];

export default function ContributePage() {
    return (
        <div className="layout">
            <aside className="sidebar">
                <div>
                    <Link href="/" className="brand">
                        {brand}
                    </Link>
                    <Navigation items={navItems} />
                </div>

                <div className="status-box">
                    <div className="status-item">
                        <span>STATUS:</span>
                        <span style={{ color: "green" }}>● ONLINE</span>
                    </div>
                    <div className="status-item">
                        <span>PARTNER:</span>
                        <span>OPEN</span>
                    </div>
                    <div className="status-item">
                        <span>THEME:</span>
                        <span>RAW_V1.0</span>
                    </div>
                </div>
            </aside>

            <main className="main-content contribute-container">
                <section className="contribute-hero">
                    <h1>JOIN THE COLLECTIVE</h1>
                    <p>&gt; 提交原创代码，共享订阅收益。</p>
                </section>

                <div className="content-grid">
                    <section className="about-section">
                        <h2 className="section-title">How It Works</h2>
                        <div className="steps-grid">
                            <div className="step-card">
                                <div className="step-number">01</div>
                                <div className="step-content">
                                    <h3>Submit Content</h3>
                                    <p>提交您的原创 Demo、源码、博客文章或技术教程。我们欢迎高质量的前端与全栈技术实现。</p>
                                </div>
                            </div>
                            <div className="step-card">
                                <div className="step-number">02</div>
                                <div className="step-content">
                                    <h3>Code Review</h3>
                                    <p>我们的技术团队将审核代码质量与原创性。确保没有侵权风险且代码结构清晰。</p>
                                </div>
                            </div>
                            <div className="step-card">
                                <div className="step-number">03</div>
                                <div className="step-content">
                                    <h3>Earn Revenue</h3>
                                    <p>审核通过后上架专栏。根据下载量与阅读点击，您将获得一定比例的订阅收入分成。</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rules-container">
                        <h2 style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
                            ⚠️ RULES OF ENGAGEMENT
                        </h2>
                        <div className="rules-list">
                            <div className="rule-item">
                                <h4>Originality Only</h4>
                                <p>必须是独立开发的原创代码。严禁抄袭、转载或未经授权使用的他人代码。一经发现将永久加入黑名单。</p>
                            </div>
                            <div className="rule-item">
                                <h4>Quality First</h4>
                                <p>我们追求工业级的代码质量。请确保变量命名规范、注释清晰，并包含完整的 Readme 文档。</p>
                            </div>
                            <div className="rule-item">
                                <h4>Exclusive Rights</h4>
                                <p>已授权给本站的付费资源，不得在其他同类平台重复上架付费（个人博客/GitHub开源除外）。</p>
                            </div>
                            <div className="rule-item">
                                <h4>Long-term Support</h4>
                                <p>若技术栈出现重大更新导致的运行错误，作者需配合进行基本的维护与修复。</p>
                            </div>
                        </div>
                    </section>

                    <section className="about-section">
                        <h2 className="section-title">Accepted Formats</h2>
                        <p>我们目前支持以下形式的投稿：</p>
                        <div className="category-badges">
                            <div className="cat-badge">Web Application Demo</div>
                            <div className="cat-badge">React / Vue Components</div>
                            <div className="cat-badge">Node.js / Rust Services</div>
                            <div className="cat-badge">Technical Tutorials</div>
                            <div className="cat-badge">Three.js / WebGL Scenes</div>
                        </div>
                    </section>

                    <section className="apply-box">
                        <p style={{ marginBottom: '20px', fontSize: '1.2rem' }}>准备好加入了吗？发送您的 GitHub 仓库地址到</p>
                        <a href="mailto:partner@namespace.dev" className="email-link">PARTNER@NAMESPACE.DEV</a>
                    </section>
                </div>
            </main>
        </div>
    );
}
