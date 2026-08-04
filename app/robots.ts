import type { MetadataRoute } from "next";
import { TESTS } from "@/lib/tests";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  // Gated tests redirect signed-out crawlers to /login; keep those, the
  // login page itself, and account/API routes out of the crawl.
  const gatedTestPaths = TESTS.filter((t) => !t.free).map((t) => `/test/${t.id}`);

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/login", ...gatedTestPaths]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
