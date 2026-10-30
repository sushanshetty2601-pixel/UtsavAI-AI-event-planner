import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppProvider } from "@/contexts/app-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "UtsavAI — The Celebration Copilot",
  description:
    "Every celebration, beautifully planned. From your first idea to the final celebration, your personal AI event planner keeps every detail, deadline and rupee under control.",
  keywords: [
    "UtsavAI",
    "AI Event Planner",
    "Celebration Planner",
    "Indian Wedding Planner",
    "Birthday Planner",
    "Budget Management",
    "Vendor Tracking",
    "PromptWars Challenge 5",
  ],
  authors: [{ name: "UtsavAI Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "UtsavAI — AI-Powered Celebration Copilot",
    description:
      "All-in-one celebration planner for Indian weddings, birthdays, and community gatherings. AI budget reality checks, vendor tracking, and multi-day timelines.",
    siteName: "UtsavAI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background text-foreground font-body antialiased selection:bg-primary/20 selection:text-primary">
        {/* Skip-to-content link for keyboard and screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AppProvider>{children}</AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
