import { prisma } from "./prisma";
import { getClientIdentity } from "./session";

export type EngagementInfo = {
  views: number;
  likes: number;
  liked: boolean;
};

const ensureEpisode = async (slug: string, title?: string) => {
  await prisma.episode.upsert({
    where: { slug },
    create: { slug, title },
    update: { title: title ?? undefined },
  });
};

export const getEngagementForRequest = async (
  slug: string,
  title?: string,
): Promise<EngagementInfo> => {
  const { sessionId, ipHash } = await getClientIdentity({ createCookie: false });

  await ensureEpisode(slug, title);

  const [views, likes, liked] = await Promise.all([
    prisma.view.count({ where: { slug } }),
    prisma.like.count({ where: { slug } }),
    prisma.like.findFirst({
      where: {
        slug,
        OR: [
          ...(sessionId ? [{ sessionId }] : []),
          ...(ipHash ? [{ ipHash }] : []),
        ],
      },
      select: { id: true },
    }),
  ]);

  return {
    views,
    likes,
    liked: Boolean(liked),
  };
};

export const getEngagementTotals = async (slugs: string[]) => {
  if (!slugs.length) return {} as Record<string, { views: number; likes: number }>;

  const [viewGroups, likeGroups] = await Promise.all([
    prisma.view.groupBy({
      by: ["slug"],
      where: { slug: { in: slugs } },
      _count: { slug: true },
    }),
    prisma.like.groupBy({
      by: ["slug"],
      where: { slug: { in: slugs } },
      _count: { slug: true },
    }),
  ]);

  const map: Record<string, { views: number; likes: number }> = {};
  slugs.forEach((slug) => {
    map[slug] = { views: 0, likes: 0 };
  });

  viewGroups.forEach((group: { slug: string; _count: { slug: number } }) => {
    if (map[group.slug]) {
      map[group.slug].views = group._count.slug;
    }
  });

  likeGroups.forEach((group: { slug: string; _count: { slug: number } }) => {
    if (map[group.slug]) {
      map[group.slug].likes = group._count.slug;
    }
  });

  return map;
};
