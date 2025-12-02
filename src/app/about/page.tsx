import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <Link href="/" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900">
          ← 返回首页
        </Link>
        <h1 className="text-3xl font-semibold">关于 About</h1>
        <p className="text-lg text-zinc-600">
          记录技术思考、系统设计与个人笔记。这里会补充联系方式与站点说明。
        </p>
      </main>
    </div>
  );
}
