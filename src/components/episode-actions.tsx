"use client";

import { usePathname } from "next/navigation";
import React from "react";

type EpisodeActionsProps = {
  date: string;
  tags?: string[];
  readingMinutes?: number;
  slug: string;
  title: string;
  views: number;
  likes: number;
  liked: boolean;
};

export function EpisodeActions({
  date,
  tags,
  readingMinutes,
  slug,
  title,
  views,
  likes,
  liked,
}: EpisodeActionsProps) {
  const [copied, setCopied] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [state, setState] = React.useState({
    views,
    likes,
    liked,
  });
  const pathname = usePathname();
  const link = typeof window !== "undefined" ? window.location.origin + pathname : pathname;

  const handleCopyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Copy link failed", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share && link) {
      try {
        await navigator.share({ url: link, title: document.title });
      } catch (error) {
        console.error("Share failed", error);
      }
      return;
    }

    handleCopyLink();
  };

  React.useEffect(() => {
    startTransition(async () => {
      try {
        const res = await import("@/app/actions/engagement").then((m) =>
          m.recordViewAction(slug, title),
        );
        if (res?.views !== undefined) {
          setState((prev) => ({ ...prev, views: res.views }));
        }
      } catch (error) {
        console.error("View record failed", error);
      }
    });
  }, [slug, title]);

  const handleLike = () => {
    startTransition(async () => {
      try {
        const res = await import("@/app/actions/engagement").then((m) =>
          m.toggleLikeAction(slug, title),
        );
        if (res) {
          setState((prev) => ({
            ...prev,
            likes: res.likes,
            liked: res.liked,
          }));
        }
      } catch (error) {
        console.error("Toggle like failed", error);
      }
    });
  };

  return (
    <div className="episode-meta">
      <div className="episode-meta-row">
        <span className="label">发布日期</span>
        <span className="value">{date}</span>
      </div>
      {readingMinutes ? (
        <div className="episode-meta-row">
          <span className="label">阅读</span>
          <span className="value">{readingMinutes} min</span>
        </div>
      ) : null}
      {tags?.length ? (
        <div className="episode-meta-row">
          <span className="label">标签</span>
          <div className="tag-list">
            {tags.slice(0, 4).map((tag) => (
              <span key={tag} className="pill">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="episode-meta-row">
        <span className="label">阅读</span>
        <span className="value">{state.views}</span>
      </div>
      <div className="episode-meta-row">
        <span className="label">点赞</span>
        <span className="value">{state.likes}</span>
      </div>

      <div className="episode-actions">
        <button type="button" onClick={handleShare} className="pill-btn" disabled={pending}>
          分享
        </button>
        <button type="button" onClick={handleCopyLink} className="pill-btn" disabled={pending}>
          {copied ? "已复制" : "复制链接"}
        </button>
        <button
          type="button"
          onClick={handleLike}
          className={`pill-btn ${state.liked ? "pill-btn-active" : ""}`}
          disabled={pending}
        >
          {state.liked ? "已点赞" : "点赞"}
        </button>
      </div>
    </div>
  );
}
