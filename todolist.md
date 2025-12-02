步骤：脚手架与基础结构 基础已完成 ✅

npx create-next-app@latest podcast --ts --tailwind --app --eslint --src-dir 已完成 ✅

步骤：MDX 内容系统 + 完美代码块

 内容目录：`src/content/episodes/*.mdx`（可按年分子目录），默认 slug = 文件名，frontmatter 可用 `slug` 覆盖
 frontmatter 字段：title、date（ISO）、episode、cover、description、tags?、slug?
 安装并配置 @next/mdx（`experimental.mdxRs: true`，`pageExtensions` 包含 mdx）+ rehype-pretty-code + rehype-slug/rehype-autolink-headings + 代码块一键复制（客户端组件包裹）
 写 content util（如 `src/lib/content.ts`）读取 MDX，输出 `{ slug, metadata, content }`，`generateStaticParams`/列表页复用
 写第一篇播客笔记 .mdx，支持上述 frontmatter，正文验证代码块样式
 实现 episodes 列表页 + 动态路由 `[slug]`（展示浏览量）

步骤：SEO 与站点基础功能

 选型：如只用 App Router 的 generateMetadata，可不装 next-seo；若保留 next-seo，避免重复注入
 每篇 generateMetadata 动态生成 og:image、title、description（数据来自 content util）
 自动生成 sitemap.xml 和 rss.xml（Route Handler），复用 content util，设置合适 revalidate；RSS 链接/ guid 用 slug 拼 URL

步骤：数据库 + 点赞功能

 在服务器装 PostgreSQL（或用 Railway 免费层）
 npx prisma init → 创建 schema.prisma（Episode、View、Like 表；View/Like 加唯一约束防重复）
 Prisma Studio 检查数据
 Prisma Client 单例封装；页面设置 dynamic/revalidate 以便浏览量实时更新
 用 Server Actions 实现「点赞」按钮（零 API，类型安全，基于用户/会话/IP 限制重复）

步骤：评论系统（Giscus，最优解）

 去 https://giscus.app 开启（只需 GitHub 仓库）
 在文章页插入 <Giscus /> 组件
 评论自动同步到你的 GitHub Discussions，主题跟随暗黑模式

步骤：播放量统计

 增加 View 表，每次访问 Server Component 自动记录浏览量 +1（可基于 IP/user/session 去重或限频）

步骤：美化 + 响应式 + 暗黑模式

 引入 shadcn/ui（npx shadcn-ui@latest init）
 加 Card、Button、Tooltip、ThemeToggle 组件
 手机端测试，确保代码块横向滚动

步骤：自托管部署脚本

 写好 pm2 ecosystem.config.js
 Nginx 配置反向代理 + HTTPS（certbot 一键）
 写一键部署脚本 deploy.sh（git pull → npm ci → prisma migrate → pm2 restart）

步骤：上线 + 监控

 推到 GitHub，服务器执行第一次部署
 提交到 Google Search Console
 加 Vercel Analytics 或 Umami（自托管隐私统计）

步骤：可选增强功能（按需挑）

 搜索功能（FlexSearch 或 typesense 自建）
 邮件订阅（Resend + React Email）
 自动从 RSS 导入播客（Cron 脚本）
 PWA 离线收听
