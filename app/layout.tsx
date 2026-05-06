import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://cosil-dispute-readiness.vercel.app"),
  title: "Dispute Readiness Check | Cosil Solutions Ltd",
  description: "A structured position and risk assessment for housing, leasehold, workplace, employment, and commercial disputes. Produced by Cosil Solutions Ltd, a strategic dispute and risk consultancy and accredited civil and commercial mediation practice.",
  keywords: [
    "dispute resolution",
    "mediation",
    "housing dispute",
    "leasehold dispute",
    "service charge dispute",
    "workplace grievance",
    "Housing Ombudsman",
    "Awaab's Law",
    "commercial dispute",
    "dispute readiness",
    "Cosil Solutions",
  ],
  authors: [{ name: "Cosil Solutions Ltd", url: "https://cosilsolutions.co.uk" }],
  openGraph: {
    title: "Dispute Readiness Check | Cosil Solutions Ltd",
    description: "Not sure where your matter sits or what to do next? Get a structured position and risk assessment from Cosil Solutions Ltd.",
    url: "https://cosil-dispute-readiness.vercel.app",
    siteName: "Cosil Solutions Ltd",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Dispute Readiness Check | Cosil Solutions Ltd",
    description: "Not sure where your matter sits or what to do next? Get a structured position and risk assessment from Cosil Solutions Ltd.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  maximumScale: 1,
};

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geist.variable} ${geistMono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <Toaster position="top-center" />
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
