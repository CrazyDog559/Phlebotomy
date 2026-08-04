import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const title = "Phlebotomy Prep — NHA CPT Practice Tests";
const description =
  "Practice tests for the NHA Certified Phlebotomy Technician (CPT) exam. 550 realistic questions across 5 full-length exams, with progress tracking and confidence marking. Try 5 questions free, no sign-up required.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Phlebotomy Prep"
  },
  description,
  keywords: [
    "phlebotomy practice test",
    "NHA CPT practice exam",
    "certified phlebotomy technician exam",
    "phlebotomy certification study guide",
    "phlebotomy exam questions",
    "NHA phlebotomy test prep"
  ],
  authors: [{ name: "Phlebotomy Prep" }],
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true
    }
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Phlebotomy Prep",
    title,
    description
  },
  twitter: {
    card: "summary",
    title,
    description
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
