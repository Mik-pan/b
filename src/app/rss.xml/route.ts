import { NextResponse } from "next/server";
import { getEpisodes } from "@/lib/content";

const SITE_URL = process.env.SITE_URL || "https://example.com";
const SITE_TITLE = "CODE_SPACE";
const SITE_DESCRIPTION = "前端技术实战博客 - React、Three.js、WebGL";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const episodes = await getEpisodes();

  const items = episodes
    .map((episode) => {
      const link = `${SITE_URL}/episodes/${episode.slug}`;
      const pubDate = new Date(episode.date).toUTCString();

      return `
    <item>
      <title>${escapeXml(episode.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      ${episode.description ? `<description>${escapeXml(episode.description)}</description>` : ""}
      ${episode.tags?.map((tag) => `<category>${escapeXml(tag)}</category>`).join("\n      ") || ""}
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
