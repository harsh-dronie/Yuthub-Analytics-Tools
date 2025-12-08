import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Provider from "./provider";

export const metadata: Metadata = {
  title: "YouTube Analytics",
  description: "AI-powered tools for YouTube content creators - Generate thumbnails, content ideas, and discover trending keywords",
  icons: {
    icon: [
      { url: '/favicon.png'}
    ],
  },
};

const outfit = Outfit({ subsets: ["latin"] });
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={outfit.className}>
          <Provider>{children}</Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}
