import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/contexts/GameContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chessarao - Играйте онлайн или против ИИ",
  description: "Шахматная игра с возможностью игры против искусственного интеллекта, локально или онлайн с друзьями",
  keywords: ["шахматы", "chess", "онлайн игра", "ИИ", "искусственный интеллект", "board game"],
  authors: [{ name: "Chessarao Team" }],
  icons: {
    icon: [
      { url: '/images/favicon.ico', sizes: 'any' },
      { url: '/images/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/images/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
    ],
    shortcut: '/images/favicon.ico',
    apple: [
      { url: '/images/favicon.ico', sizes: '180x180', type: 'image/x-icon' },
    ],
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8B5CF6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <GameProvider>
                {children}
              </GameProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
