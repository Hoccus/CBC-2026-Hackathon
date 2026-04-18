"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/coach", label: "Coach" },
  { href: "/track", label: "Track" },
  { href: "/macros", label: "Macros" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/profile", label: "Profile" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">NutriCoach</Link>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`nav-link${pathname === l.href ? " nav-link-active" : ""}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
