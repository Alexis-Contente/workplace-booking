"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { useUserProfile } from "../hooks/useUserProfile";
import { signOut } from "../lib/auth-helpers";

export default function Header() {
  const { isAuthenticated } = useAuth();
  const { getFullName } = useUserProfile();
  const pathname = usePathname();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      console.error("Logout error:", error);
    } else {
      window.location.href = "/login";
    }
  };

  // Function to determine if a link is active
  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  // Styles pour les boutons actifs et inactifs
  const getButtonStyles = (path: string): string => {
    if (isActive(path)) {
      return "bg-blue-600 text-white px-4 py-2 rounded font-semibold";
    }
    return "bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer";
  };

  return (
    <header className="bg-blue-500 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-white text-4xl font-bold uppercase">
          Workplace Booking
        </h1>
        <div className="flex gap-4 items-center">
          {isAuthenticated && (
            // Menu for authenticated users
            <>
              <div className="text-white text-sm">
                Welcome, {getFullName() || "User"}!
              </div>
              <Link href="/">
                <button className={getButtonStyles("/")}>Dashboard</button>
              </Link>
              <Link href="/reservations">
                <button className={getButtonStyles("/reservations")}>
                  Reservations
                </button>
              </Link>
              <Link href="/global-bookings">
                <button className={getButtonStyles("/global-bookings")}>
                  Overview
                </button>
              </Link>
              <Link href="/profile">
                <button className={getButtonStyles("/profile")}>Profile</button>
              </Link>
              <Link href="/about">
                <button className={getButtonStyles("/about")}>About</button>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
