import Link from "next/link";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <Link href="/" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900">
          ← 返回首页
        </Link>
        <h1 className="text-3xl font-semibold">项目 Projects</h1>
        <p className="text-lg text-zinc-600">
          后续在这里展示正在维护的项目、开源仓库与 Demo。
        </p>
      </main>
    </div>
  );
}
