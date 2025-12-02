import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import type { ReactElement } from "react";
import { rehypePlugins } from "../../mdx-plugins";
import { CodeBlock } from "@/components/mdx/code-block";

export type EpisodeFrontmatter = {
  title: string;
  date: string;
  episode?: string;
  cover?: string;
  description?: string;
  tags?: string[];
  slug?: string;
};

export type EpisodeMeta = Omit<EpisodeFrontmatter, "slug"> & {
  slug: string;
  readingMinutes: number;
};

type EpisodeIndexItem = EpisodeMeta & {
  filePath: string;
  body: string;
};

const EPISODE_DIR = path.join(process.cwd(), "src/content/episodes");
const MDX_EXTENSION = ".mdx";

const isValidString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0;

const toSlug = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

function normalizeFrontmatter(
  data: Record<string, unknown>,
  fallbackSlug: string,
): Omit<EpisodeMeta, "readingMinutes"> {
  const slug = isValidString(data.slug) ? toSlug(data.slug) : fallbackSlug;
  const title = isValidString(data.title) ? toSlug(data.title) : "";
  const date = isValidString(data.date) ? toSlug(data.date) : "";

  if (!title) {
    throw new Error(
      `Missing required "title" in frontmatter for "${fallbackSlug}"`,
    );
  }

  if (!date) {
    throw new Error(
      `Missing required "date" in frontmatter for "${fallbackSlug}"`,
    );
  }

  const episode =
    typeof data.episode === "number" || isValidString(data.episode)
      ? String(data.episode)
      : undefined;

  const cover = isValidString(data.cover) ? toSlug(data.cover) : undefined;
  const description = isValidString(data.description)
    ? toSlug(data.description)
    : undefined;

  const tags = Array.isArray(data.tags)
    ? data.tags
        .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
        .filter(Boolean)
    : undefined;

  return {
    slug,
    title,
    date,
    episode,
    cover,
    description,
    tags,
  };
}

const countWords = (text: string) =>
  text
    .replace(/[`*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

const calcReadingMinutes = (body: string) =>
  Math.max(1, Math.ceil(countWords(body) / 180));

const sortByDateDesc = (a: EpisodeMeta, b: EpisodeMeta) => {
  const aTime = Date.parse(a.date);
  const bTime = Date.parse(b.date);

  if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;

  return bTime - aTime;
};

const collectMdxFiles = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return collectMdxFiles(fullPath);
      }

      if (entry.isFile() && entry.name.endsWith(MDX_EXTENSION)) {
        return [fullPath];
      }

      return [];
    }),
  );

  return nested.flat();
};

const withEpisodeFiles = async () => {
  await fs.mkdir(EPISODE_DIR, { recursive: true });
  return collectMdxFiles(EPISODE_DIR);
};

const fallbackSlugFromPath = (filePath: string) =>
  path
    .relative(EPISODE_DIR, filePath)
    .replace(new RegExp(`${MDX_EXTENSION}$`), "")
    .replace(/[\\/]/g, "-");

const buildIndex = async (): Promise<EpisodeIndexItem[]> => {
  const files = await withEpisodeFiles();

  const parsed = await Promise.all(
    files.map(async (filePath) => {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = matter(raw);
      const { data, content } = parsed;
      const fallbackSlug = fallbackSlugFromPath(filePath);
      const meta = normalizeFrontmatter(data, fallbackSlug);
      const readingMinutes = calcReadingMinutes(content);

      return { ...meta, filePath, body: content, readingMinutes };
    }),
  );

  return parsed.sort(sortByDateDesc);
};

export const getEpisodeSlugs = async (): Promise<string[]> => {
  const index = await buildIndex();
  return index.map((item) => item.slug);
};

export const getEpisodes = async (): Promise<EpisodeMeta[]> => {
  const index = await buildIndex();
  return index.map(({ filePath, ...meta }) => meta);
};

export const getEpisodeBySlug = async (slug: string) => {
  const index = await buildIndex();
  const match = index.find((item) => item.slug === slug);

  if (!match) {
    throw new Error(`Episode not found for slug "${slug}"`);
  }

  const source = await fs.readFile(match.filePath, "utf8");
  const { content, frontmatter } = await compileMDX<EpisodeFrontmatter>({
    source,
    components: {
      pre: (props) => <CodeBlock {...props} />,
    },
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        rehypePlugins: [...rehypePlugins],
      },
    },
  });

  const metaBase = normalizeFrontmatter(frontmatter ?? {}, match.slug);
  const readingMinutes = match.readingMinutes ?? calcReadingMinutes(source);
  const meta = { ...metaBase, readingMinutes };

  return { meta, content: content as ReactElement };
};
