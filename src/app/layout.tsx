import type { Metadata, Viewport } from "next";
import { Inter, Merriweather } from "next/font/google";
import { DataSaverProvider } from "@/contexts/DataSaverContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CreationProvider } from "@/contexts/CreationContext";
import { NetworkDebugger } from "@/components/layout/NetworkDebugger";
import "./globals.css";

// UI Font - Clean and modern for interface elements
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Reading Font - Optimized for study notes readability
const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SyllabiQ - Smart Study Companion",
  description:
    "Democratize education by converting high-bandwidth content into low-data, syllabus-aligned study packs for Sri Lankan students (Grades 6-13).",
  keywords: [
    "education",
    "Sri Lanka",
    "study",
    "offline learning",
    "low data",
    "syllabus",
    "exam preparation",
    "O/L",
    "A/L",
  ],
  authors: [{ name: "Team Lucid Edge" }],
  creator: "Team Lucid Edge",
  publisher: "SyllabiQ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.variable} ${merriweather.variable} antialiased`}
      >
        <AuthProvider>
          <DataSaverProvider>
            <CreationProvider>
              {children}
              <NetworkDebugger />
            </CreationProvider>
          </DataSaverProvider>
        </AuthProvider>
      </body>
    </html>
  );
}