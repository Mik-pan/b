import Link from "next/link";

export default function ArchivesPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <Link href="/" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900">
          ← 返回首页
        </Link>
        <h1 className="text-3xl font-semibold">归档 Archives</h1>
        <p className="text-lg text-zinc-600">
          这里将按时间或标签列出历史文章，后续会接入搜索与筛选。
        </p>
      </main>
    </div>
  );
}
