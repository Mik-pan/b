"use client";

import React, { useState, useRef, useEffect } from "react";

type PreProps = React.HTMLAttributes<HTMLPreElement> & {
  children?: React.ReactNode;
};

const MAX_HEIGHT = 180;

export function CodeBlock({ children, className, ...rest }: PreProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const language =
    (rest as { ["data-language"]?: string })["data-language"] ??
    (typeof className === "string" && className.startsWith("language-")
      ? className.replace("language-", "")
      : "");

  // Check if content exceeds max height
  useEffect(() => {
    if (preRef.current) {
      const height = preRef.current.scrollHeight;
      setNeedsExpansion(height > MAX_HEIGHT);
    }
  }, [children]);

  const handleCopy = async () => {
    const text = preRef.current?.textContent ?? "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className="code-block"
      data-language={language}
      data-collapsed={needsExpansion && !isExpanded ? "true" : "false"}
    >
      <pre
        ref={preRef}
        className={className}
        {...rest}
        style={{
          maxHeight: needsExpansion && !isExpanded ? `${MAX_HEIGHT}px` : undefined,
          overflow: needsExpansion && !isExpanded ? "hidden" : undefined,
        }}
      >
        {children}
      </pre>
      <button
        type="button"
        className="code-copy"
        aria-label="复制代码"
        onClick={handleCopy}
      >
        {copied ? "已复制" : "复制"}
      </button>
      {needsExpansion && (
        <button
          type="button"
          className="code-expand"
          onClick={toggleExpand}
          aria-label={isExpanded ? "收起代码" : "展开代码"}
        >
          {isExpanded ? "收起 ▲" : "展开查看全部 ▼"}
        </button>
      )}
    </div>
  );
}
