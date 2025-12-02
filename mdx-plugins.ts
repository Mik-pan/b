import type { Pluggable } from "unified";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode, { type Options as RehypePrettyCodeOptions } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";

const prettyCodeOptions: RehypePrettyCodeOptions = {
  theme: "one-dark-pro",
  keepBackground: false,
};

export const rehypePlugins: Pluggable[] = [
  [rehypePrettyCode, prettyCodeOptions],
  rehypeSlug,
  [rehypeAutolinkHeadings, { behavior: "wrap" }],
];
