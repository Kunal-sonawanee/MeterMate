import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import { Toaster } from "sonner";
import Providers from "@/components/providers";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Geist has no Devanagari glyphs, so Hindi and Marathi text would otherwise
// fall back to whatever sans-serif each OS ships — inconsistent weight and
// size next to the Latin UI. This fills exactly that gap; Latin text still
// renders in Geist since it's listed first in the `--font-sans` stack.
const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MeterMate — electricity meter readings and billing",
    template: "%s · MeterMate",
  },
  description:
    "Record monthly electricity meter readings across your properties, and get units and bill amounts worked out for you.",
  applicationName: "MeterMate",
  formatDetection: { telephone: false },
  authors: [{ name: "Kantex Technologies" }],
  creator: "Kantex Technologies",
  publisher: "Kantex Technologies",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafb" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1d20" },
  ],
  // Users on small screens may need to zoom into a meter number.
  maximumScale: 5,
};

/**
 * Applies the stored theme before first paint, so a dark-mode user never sees
 * a white flash on load. Kept tiny and dependency-free on purpose.
 */
const themeScript = `
(function(){
  try {
    var raw = localStorage.getItem('${THEME_STORAGE_KEY}');
    var stored = raw ? JSON.parse(raw) : 'system';
    var dark = stored === 'dark' || (stored !== 'light' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansDevanagari.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background text-foreground min-h-dvh">
        <Providers>
          {children}
          <Toaster
            position="bottom-center"
            offset={80}
            mobileOffset={88}
            richColors
            closeButton
            toastOptions={{ duration: 4000 }}
          />
        </Providers>
      </body>
    </html>
  );
}
