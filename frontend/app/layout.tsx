import "./globals.css";

import type { Metadata } from "next";

import { QueryProvider } from "@/components/query-provider";
import { TopNav } from "@/components/top-nav";


export const metadata: Metadata = {
  title: "Dialect Video Annotator",
  description: "YouTube-based voice collection and annotation tool",
};


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <TopNav />
          <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}

