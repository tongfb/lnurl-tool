import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZAPM LN Tools — Lightning Address, LNURL & QR",
  description: "ZAPM LN Tools is a local-first, provider-agnostic browser tool for Lightning Addresses, LNURL-pay endpoints, Bech32 LNURLs, and QR codes.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
