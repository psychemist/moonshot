import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learning Graph — a small step toward a big goal",
  description: "Find a realistic next learning step toward building a Hack assembler in C.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
