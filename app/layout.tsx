import type { Metadata, Viewport } from "next";
import { SessionStart } from "./components/client";
import { NavTracker } from "./components/back";
import { ResetFromUrl } from "./components/reset";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Home · Property Finder prototype",
  description: "PropWorth valuation, monthly owner update, rent watch and resale price check for JVC, Dubai.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f2f2f7" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionStart />
        <NavTracker />
        <ResetFromUrl />
        {children}
      </body>
    </html>
  );
}
