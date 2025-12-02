"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getClientIdentity } from "@/lib/session";

const MIN_LEN = 3;
const MAX_LEN = 2000;
const RATE_LIMIT_SECONDS =
  process.env.NODE_ENV === "production" ? 30 : 0;

const normalize = (text: string) => text.trim();

export async function createCommentAction(
  slug: string,
  content: string,
  parentId?: number,
) {
  const clean = normalize(content);
  if (clean.length < MIN_LEN) {
    throw new Error("评论内容太短");
  }
  if (clean.length > MAX_LEN) {
    throw new Error("评论内容过长");
  }

  const { sessionId, ipHash } = await getClientIdentity({ createCookie: true });
  if (!sessionId) {
    throw new Error("无法获取会话");
  }

  // 简单限频：同 session/IP 30 秒内一次
  if (RATE_LIMIT_SECONDS > 0) {
    const recent = await prisma.comment.findFirst({
      where: {
        slug,
        OR: [
          { sessionId },
          ...(ipHash ? [{ ipHash }] : []),
        ],
        createdAt: {
          gte: new Date(Date.now() - RATE_LIMIT_SECONDS * 1000),
        },
      },
    });
    if (recent) {
      throw new Error("操作太频繁，请稍后再试");
    }
  }

  await prisma.episode.upsert({
    where: { slug },
    create: { slug },
    update: {},
  });

  await prisma.comment.create({
    data: {
      slug,
      sessionId,
      ipHash,
      content: clean,
      parentId,
    },
  });

  revalidatePath(`/episodes/${slug}`);
  return { ok: true };
}

export async function listComments(slug: string) {
  const items = await prisma.comment.findMany({
    where: { slug },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      parentId: true,
    },
  });

  return items;
}
