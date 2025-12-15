"use server";

import { prisma } from "@/lib/prisma";
import { getClientIdentity } from "@/lib/session";

type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export const recordViewAction = async (slug: string, title?: string) => {
  const { sessionId, ipHash } = await getClientIdentity({ createCookie: true });
  if (!sessionId) return { views: 0, likes: 0, liked: false };

  await prisma.$transaction(async (tx: TransactionClient) => {
    await tx.episode.upsert({
      where: { slug },
      create: { slug, title },
      update: { title: title ?? undefined },
    });

    if (ipHash) {
      const existingIp = await tx.view.findFirst({
        where: { slug, ipHash },
      });
      if (existingIp) return;
    }

    await tx.view.upsert({
      where: { slug_sessionId: { slug, sessionId } },
      create: { slug, sessionId, ipHash },
      update: { ipHash },
    });
  });

  const [views, likes, liked] = await Promise.all([
    prisma.view.count({ where: { slug } }),
    prisma.like.count({ where: { slug } }),
    prisma.like.findFirst({
      where: {
        slug,
        OR: [{ sessionId }, ...(ipHash ? [{ ipHash }] : [])],
      },
      select: { id: true },
    }),
  ]);

  return { views, likes, liked: Boolean(liked) };
};

export const toggleLikeAction = async (slug: string, title?: string) => {
  const { sessionId, ipHash } = await getClientIdentity({ createCookie: true });
  if (!sessionId) return { liked: false, likes: 0 };

  await prisma.episode.upsert({
    where: { slug },
    create: { slug, title },
    update: { title: title ?? undefined },
  });

  const existing = await prisma.like.findFirst({
    where: {
      slug,
      OR: [
        { sessionId },
        ...(ipHash ? [{ ipHash }] : []),
      ],
    },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    try {
      await prisma.like.create({
        data: { slug, sessionId, ipHash },
      });
    } catch (error) {
      // 可能被唯一约束拦截，忽略
    }
  }

  const likes = await prisma.like.count({ where: { slug } });

  return { liked: !existing, likes };
};
