import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LNURL TOOL — Lightning Address, Bech32 & QR",
  description: "A private, provider-agnostic browser tool for converting Lightning Addresses, LNURL-pay endpoints, Bech32 LNURLs, and QR codes.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
