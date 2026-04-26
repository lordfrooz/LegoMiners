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
  title: "Lego Miners | a new standart",
  description: "Lego Miners | a new standart",
  openGraph: {
    title: "Lego Miners | a new standart",
    description: "Lego Miners | a new standart",
    images: ["/legominers.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lego Miners | a new standart",
    description: "Lego Miners | a new standart",
    images: ["/legominers.jpg"],
  },
  icons: {
    icon: "/legominers.jpg",
    apple: "/legominers.jpg",
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
