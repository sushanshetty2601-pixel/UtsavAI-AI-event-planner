import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppProvider } from "@/contexts/app-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "UtsavAI — The Celebration Copilot",
  description:
    "Every celebration, beautifully planned. From your first idea to the final celebration, your personal AI event planner keeps every detail, deadline and rupee under control.",
  icons: {
    icon: "/favicon.ico",
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
