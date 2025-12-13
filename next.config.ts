import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withMDX = createMDX();

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
};

export default withMDX(nextConfig);
