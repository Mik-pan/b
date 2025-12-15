import Link from "next/link";
import { getEpisodes } from "@/lib/content";
import { getEngagementTotals } from "@/lib/engagement";

export const dynamic = "force-dynamic";

const formatDate = (value: string) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  const date = new Date(parsed);

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

const brand = "CODE_SPACE";
const navItems = [
  { label: "[01] 首页 / Home", href: "/" },
  { label: "[02] 关于 / About", href: "/about" },
  { label: "[03] 订阅 / Subscribe", href: "/subscribe" },
  { label: "[04] 贡献 / Contribute", href: "/contribute" },
];

export default async function Home() {
  const episodes = await getEpisodes();
  const totals = await getEngagementTotals(episodes.map((e) => e.slug));

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
            <span>UPTIME:</span>
            <span>140h 23m</span>
          </div>
          <div className="status-item">
            <span>THEME:</span>
            <span>RAW_V1.0</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <section className="hero">
          <h1>Exploring the art of code structure & system design.</h1>
          <p>&gt; 记录技术与思考。</p>
        </section>

        <div className="post-list">
          {episodes.length === 0 ? (
            <article className="post-item">
              <div className="post-date">—</div>
              <div className="post-title">暂无内容，先添加一篇 MDX 到 src/content/episodes</div>
              <div className="post-meta-right">
                <span className="post-tag">Draft</span>
              </div>
            </article>
          ) : (
            episodes.map((episode) => (
              <Link
                key={episode.slug}
                href={`/episodes/${episode.slug}`}
                className="post-item"
              >
                <div className="post-date">{formatDate(episode.date)}</div>
                <div className="post-title">{episode.listTitle ?? episode.title}</div>
                <div className="post-meta-right">
                  {episode.tags?.length ? (
                    <span className="post-tag">{episode.tags[0]}</span>
                  ) : (
                    <span className="post-tag">Note</span>
                  )}
                  <span className="post-tag">
                    👁 {totals[episode.slug]?.views ?? 0}
                  </span>
                  <span className="post-tag">
                    ♥ {totals[episode.slug]?.likes ?? 0}
                  </span>
                  <span className="arrow">→</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
