import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "LoopBazar - Shop Your Favorites",
  description: "Fresh deals every day, delivered to your door.",
};

import { Toaster } from "react-hot-toast";
import { StoreProvider } from "../store/StoreProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>        
      <body className="min-h-full flex flex-col" suppressHydrationWarning>      
        <StoreProvider>
          <Toaster position="top-center" />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
