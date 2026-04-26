import type { Metadata, Viewport } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import { IBM_Plex_Mono, Manrope, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Lego Miners | on @Base",
  description: "Join the adventure, mine valuable resources, earn rewards, and build your legacy in the Lego Miners universe.",
  openGraph: {
    title: "Lego Miners | on @Base",
    description: "Join the adventure, mine valuable resources, earn rewards, and build your legacy in the Lego Miners universe.",
    url: "https://legominers.xyz",
    siteName: "Lego Miners",
    images: [
      {
        url: "https://legominers.xyz/legominers.jpeg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lego Miners | on @Base",
    description: "Join the adventure, mine valuable resources, earn rewards, and build your legacy in the Lego Miners universe.",
    images: ["https://legominers.xyz/legominers.jpeg"],
  },
  icons: {
    icon: "/legominers.jpeg",
    apple: "/legominers.jpeg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
