import { NextResponse } from "next/server";

export async function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>DEV_LOG RSS</title>
    <description>RSS 订阅将在后续补充为真实数据。</description>
    <link>https://example.com</link>
  </channel>
</rss>`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
