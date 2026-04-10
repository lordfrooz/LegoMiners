import type { Metadata } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import { IBM_Plex_Mono, Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const display = Poppins({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const body = Inter({
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
  title: "TempoTopia | a new standart",
  description: "TempoTopia | a new standart",
  openGraph: {
    title: "TempoTopia | a new standart",
    description: "TempoTopia | a new standart",
    images: ["/logo.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "TempoTopia | a new standart",
    description: "TempoTopia | a new standart",
    images: ["/logo.jpg"],
  },
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
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
