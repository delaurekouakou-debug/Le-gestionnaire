import type { NextConfig } from "next";

// GITHUB_PAGES=true est défini uniquement par le workflow de déploiement
// (.github/workflows/deploy-gh-pages.yml). En local, basePath/assetPrefix
// restent vides pour que `npm run dev` fonctionne normalement sur "/".
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = "Le-gestionnaire";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isGithubPages ? `/${repoName}` : "",
  assetPrefix: isGithubPages ? `/${repoName}/` : "",
};

export default nextConfig;
