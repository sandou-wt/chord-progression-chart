import "./globals.css";
import { PLACEHOLDER_ORIGIN } from "@/lib/config";

export const metadata = {
  metadataBase: new URL(PLACEHOLDER_ORIGIN),
  title: {
    default: "Chord Progression Chart: All 12 Keys (Free & Interactive)",
    template: "%s",
  },
  description:
    "Free interactive chord progression chart for guitar and piano. Pick a key and a style, hear common progressions, transpose to any key, and print the chart. All 12 major and minor keys.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
