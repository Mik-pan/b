import Link from "next/link";


export const metadata = {
    title: "订阅专栏 | CODE_SPACE",
    description: "订阅获取全部源码，支持商业使用",
};

const brand = "CODE_SPACE";
const navItems = [
    { label: "[01] 首页 / Home", href: "/" },
    { label: "[02] 关于 / About", href: "/about" },
    { label: "[03] 订阅 / Subscribe", href: "/subscribe" },
    { label: "[04] 贡献 / Contribute", href: "/contribute" },
];

export default function SubscribePage() {
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
                        <span>OFFER:</span>
                        <span style={{ color: "var(--accent-color)" }}>ACTIVE</span>
                    </div>
                    <div className="status-item">
                        <span>THEME:</span>
                        <span>RAW_V1.0</span>
                    </div>
                </div>
            </aside>

            <main className="main-content subscribe-content">
                <section className="subscribe-hero">
                    <h1>UNLOCK FULL ACCESS</h1>
                    <p>&gt; 获取源码，支持商用，开启无限可能。</p>
                </section>

                <section className="pricing-container">
                    {/* Free Plan */}
                    <div className="pricing-card">
                        <div className="card-header">
                            <h2>Free</h2>
                            <div className="price">¥0</div>
                            <div className="plan-type">普通用户</div>
                        </div>
                        <ul className="features">
                            <li>✓ 查看所有技术博客</li>
                            <li className="disabled">✕ 下载源码 / Demo</li>
                            <li className="disabled">✕ 商业使用授权</li>
                            <li className="disabled">✕ 优先技术支持</li>
                        </ul>
                        <button className="cta-button outline" disabled>
                            当前版本
                        </button>
                    </div>

                    {/* Subscriber Plan (Active Promo) */}
                    <div className="pricing-card featured">
                        <div className="promo-badge">★ 限时活动: 1元/年</div>
                        <div className="card-header">
                            <h2>Pro</h2>
                            <div className="price">
                                <span className="original-price">¥199</span>
                                <span className="current-price">¥1</span>
                                <span className="period">/年</span>
                            </div>
                            <div className="plan-type">订阅用户</div>
                        </div>
                        <ul className="features">
                            <li>✓ 查看所有技术博客</li>
                            <li>✓ <strong>下载全部源码 / Demo</strong></li>
                            <li>✓ <strong>商业使用授权</strong></li>
                            <li>✓ 优先技术支持</li>
                        </ul>
                        <button className="cta-button primary">
                            立即订阅 (Limit Offer)
                        </button>
                    </div>
                </section>

                <section className="faq-section">
                    <h3>Plans Breakdown</h3>
                    <div className="faq-grid">
                        <div className="faq-item">
                            <h4>权益对比</h4>
                            <p>普通用户仅可阅读内容。订阅用户拥有代码仓库访问权限，可直接下载工程源码并在您的商业项目中任意使用。</p>
                        </div>
                        <div className="faq-item">
                            <h4>关于活动</h4>
                            <p>当前开启限时一元订阅活动（原价199元），订阅有效期为一年。到期后不仅可保留已下载代码的商用权，还可优先续费。</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
