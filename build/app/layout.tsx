import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learning Graph — a small step toward a big goal",
  description: "Find a realistic next learning step toward building a Hack assembler in C.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeInit = `(function(){try{var t=localStorage.getItem('learning-graph.theme');document.documentElement.dataset.theme=t==='dark'||t==='light'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})()`;
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeInit }}/></head><body>{children}</body></html>;
}
