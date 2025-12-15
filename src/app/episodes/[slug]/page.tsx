import Link from "next/link";
import { notFound } from "next/navigation";
import { Comments } from "@/components/comments";
import { EpisodeActions } from "@/components/episode-actions";
import { getEpisodeBySlug, getEpisodeMetaBySlug, getEpisodeSlugs } from "@/lib/content";
import { EpisodeScrollControls } from "@/components/episode-scroll-controls";

export async function generateStaticParams() {
  const slugs = await getEpisodeSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

type EpisodePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: EpisodePageProps) {
  const { slug } = await params;

  try {
    const meta = await getEpisodeMetaBySlug(slug);

    return {
      title: meta.title,
      description: meta.description ?? meta.title,
      openGraph: {
        title: meta.title,
        description: meta.description ?? meta.title,
        images: meta.cover ? [{ url: meta.cover }] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { slug } = await params;

  try {
    const { meta, content } = await getEpisodeBySlug(slug);

    return (
      <div className="episode-layout">
        <aside className="episode-aside">
          <Link href="/" className="back-link">
            <svg
              aria-hidden="true"
              focusable="false"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            返回
          </Link>
            <EpisodeActions
              date={meta.date}
              tags={meta.tags}
              readingMinutes={meta.readingMinutes}
              slug={meta.slug}
              title={meta.title}
              views={0}
              likes={0}
              liked={false}
            />
          </aside>
        <EpisodeScrollControls title={meta.title} description={meta.description} />

        <main className="episode-main">
          <div className="episode-container">
            <header className="episode-header">
              <p className="episode-date">{meta.date}</p>
              <h1 className="episode-title">{meta.title}</h1>
              {meta.description && (
                <p className="episode-desc">{meta.description}</p>
              )}
            </header>

            <article className="mdx-body">{content}</article>

            <section className="episode-comments">
              <h2 className="comments-title">评论</h2>
              <Comments slug={meta.slug} />
            </section>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error(error);
    notFound();
  }
}
