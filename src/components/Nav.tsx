"use client";

import { cn } from "@/lib/cn";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/plants", label: "Plants" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/disease", label: "Disease scan" },
];

export function Nav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="border-b border-emerald-900/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-emerald-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white text-sm">
            GS
          </span>
          GreenScape AR
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-2 transition-colors",
                pathname === l.href
                  ? "bg-emerald-50 text-emerald-900"
                  : "text-zinc-600 hover:bg-emerald-50/60 hover:text-emerald-900"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-zinc-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm">
          {status === "loading" ? (
            <span className="text-zinc-400">…</span>
          ) : session ? (
            <>
              <Link
                href="/orders"
                className="rounded-md px-3 py-2 text-zinc-700 hover:bg-emerald-50"
              >
                Orders
              </Link>
              <Link
                href="/cart"
                className="rounded-md px-3 py-2 text-zinc-700 hover:bg-emerald-50"
              >
                Cart
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-2 text-zinc-700 hover:bg-emerald-50"
              >
                Dashboard
              </Link>
              {session.user.role === "VENDOR" || session.user.role === "ADMIN" ? (
                <Link
                  href="/vendor"
                  className="rounded-md px-3 py-2 text-zinc-700 hover:bg-emerald-50"
                >
                  Vendor
                </Link>
              ) : null}
              {session.user.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className="rounded-md px-3 py-2 text-zinc-700 hover:bg-emerald-50"
                >
                  Admin
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-700 hover:bg-zinc-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-zinc-700 hover:bg-emerald-50"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
      {mounted && mobileMenuOpen && (
        <div className="md:hidden border-t border-emerald-900/10 bg-white px-4 py-3 space-y-2 animate-in fade-in duration-200">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block rounded-md px-3 py-2 transition-colors",
                pathname === l.href
                  ? "bg-emerald-50 text-emerald-900"
                  : "text-zinc-600 hover:bg-emerald-50/60 hover:text-emerald-900"
              )}
            >
              {l.label}
            </Link>
          ))}
          <div className="border-t border-zinc-200 pt-2 mt-2 space-y-2">
            {status === "loading" ? (
              <span className="block px-3 py-2 text-zinc-400">…</span>
            ) : session ? (
              <>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-zinc-700 hover:bg-emerald-50"
                >
                  Orders
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-zinc-700 hover:bg-emerald-50"
                >
                  Cart
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-zinc-700 hover:bg-emerald-50"
                >
                  Dashboard
                </Link>
                {session.user.role === "VENDOR" || session.user.role === "ADMIN" ? (
                  <Link
                    href="/vendor"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-md px-3 py-2 text-zinc-700 hover:bg-emerald-50"
                  >
                    Vendor
                  </Link>
                ) : null}
                {session.user.role === "ADMIN" ? (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-md px-3 py-2 text-zinc-700 hover:bg-emerald-50"
                  >
                    Admin
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full text-left rounded-md border border-zinc-200 px-3 py-2 text-zinc-700 hover:bg-zinc-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-zinc-700 hover:bg-emerald-50"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-700 text-center"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
