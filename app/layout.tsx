import type { Metadata } from "next";
import "./globals.css";
import "@xyflow/react/dist/style.css";
import { TopNav } from "@/components/layout/top-nav";

export const metadata: Metadata = {
  title: "Agentic Insurance OS",
  description: "Marketplace and process builder for insurance agents"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="platform-root">
          <div className="app-atmosphere" aria-hidden="true">
            <span className="app-atmosphere__blob app-atmosphere__blob--one" />
            <span className="app-atmosphere__blob app-atmosphere__blob--two" />
            <span className="app-atmosphere__blob app-atmosphere__blob--three" />
          </div>
          <TopNav />
          <div className="platform-content">{children}</div>
        </div>
      </body>
    </html>
  );
}
