import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "pdf-lib"],
  reactCompiler: true,
};

export default nextConfig;
