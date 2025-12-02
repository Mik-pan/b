"use client";

import React, { useMemo, useState } from "react";

type PreProps = React.HTMLAttributes<HTMLPreElement> & {
  children?: React.ReactNode;
};

const extractText = (node: React.ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join("");
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractText(node.props.children);
  }

  return "";
};

export function CodeBlock({ children, className, ...rest }: PreProps) {
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => extractText(children), [children]);
  const language =
    (rest as { ["data-language"]?: string })["data-language"] ??
    (typeof className === "string" && className.startsWith("language-")
      ? className.replace("language-", "")
      : "");

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  return (
    <div className="code-block" data-language={language}>
      <pre className={className} {...rest}>
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
    </div>
  );
}
