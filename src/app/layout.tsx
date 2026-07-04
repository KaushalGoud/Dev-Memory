import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DevMemoryProvider } from "@/context/dev-memory-context";
import { PageWrapper } from "@/components/page-wrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "DevMemory — Permanent AI Code Review Assistant",
  description:
    "An AI code review assistant that retains codebase and repository context permanently across developer sessions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <DevMemoryProvider>
          <PageWrapper>{children}</PageWrapper>
        </DevMemoryProvider>
      </body>
    </html>
  );
}
