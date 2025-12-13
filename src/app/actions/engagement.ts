"use server";

import { revalidatePath } from "next/cache";
import { getEngagementForRequest } from "@/lib/engagement";
import { prisma } from "@/lib/prisma";
import { getClientIdentity } from "@/lib/session";
import { Prisma } from "@prisma/client";

type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export const recordViewAction = async (slug: string, title?: string) => {
  const { sessionId, ipHash } = await getClientIdentity({ createCookie: true });
  if (!sessionId) return { views: 0 };

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

  const views = await prisma.view.count({ where: { slug } });
  return { views };
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
  revalidatePath(`/episodes/${slug}`);

  return { liked: !existing, likes };
};

export const getEngagement = async (slug: string, title?: string) =>
  getEngagementForRequest(slug, title);
