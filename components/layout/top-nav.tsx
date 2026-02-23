"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/builder", label: "Builder" },
  { href: "/process-library", label: "Process Library" }
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="top-nav">
      <div className="top-nav__inner">
        <Link href="/marketplace" className="top-nav__brand">
          <span className="top-nav__brand-mark">AI</span>
          <span className="top-nav__brand-copy">
            <span className="top-nav__brand-title">Agentic Insurance OS</span>
            <span className="top-nav__brand-subtitle">Marketplace + Process Studio</span>
          </span>
        </Link>

        <nav className="top-nav__links" aria-label="Primary">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`top-nav__link ${isActive ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
