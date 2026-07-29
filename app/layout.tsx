import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";

export const metadata: Metadata = {
  title: "Phlebotomy Prep — NHA CPT Practice Tests",
  description:
    "Practice tests for the NHA Certified Phlebotomy Technician (CPT) exam. Track your progress, mark your confidence, and study smarter."
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
