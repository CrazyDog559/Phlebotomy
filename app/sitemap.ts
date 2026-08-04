import type { MetadataRoute } from "next";
import { TESTS } from "@/lib/tests";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only list pages a signed-out visitor can actually see: the landing
  // page and the one free test (others redirect to /login).
  const freeTestPaths = TESTS.filter((t) => t.free).map((t) => ({
    url: `${siteUrl}/test/${t.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.8
  }));

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1
    },
    ...freeTestPaths
  ];
}
