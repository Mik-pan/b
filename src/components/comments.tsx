"use client";

import React from "react";
import { createCommentAction, listComments } from "@/app/actions/comments";

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  parentId: number | null;
};

type CommentsProps = {
  slug: string;
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function Comments({ slug }: CommentsProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Comment[]>([]);
  const [content, setContent] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listComments(slug);
      setItems(
        data.map((c) => ({
          ...c,
          createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
        })),
      );
      setError(null);
    } catch (err) {
      console.error(err);
      setError("加载评论失败");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = () => {
    if (!content.trim()) {
      setError("请输入评论内容");
      return;
    }
    startTransition(async () => {
      try {
        await createCommentAction(slug, content.trim());
        setContent("");
        await load();
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "提交失败");
      }
    });
  };

  return (
    <div className="comments-box">
      <div className="comment-form">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的想法..."
          rows={3}
          maxLength={2000}
        />
        <div className="comment-actions">
          {error ? <span className="comment-error">{error}</span> : null}
          <button type="button" onClick={handleSubmit} disabled={pending}>
            {pending ? "提交中..." : "发表评论"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="comment-placeholder">加载中...</p>
      ) : items.length === 0 ? (
        <p className="comment-placeholder">还没有评论，来抢沙发吧。</p>
      ) : (
        <ul className="comment-list">
          {items.map((item) => (
            <li key={item.id} className="comment-item">
              <div className="comment-meta">{formatTime(item.createdAt)}</div>
              <p className="comment-content">{item.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
