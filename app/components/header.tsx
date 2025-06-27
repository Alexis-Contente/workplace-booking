"use client";

import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { signOut } from "../../lib/auth-helpers";

export default function Header() {
  const { user, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      console.error("Logout error:", error);
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <header className="bg-blue-500 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-white text-4xl font-bold uppercase">
          Workplace Booking
        </h1>
        <div className="flex gap-4 items-center">
          {isAuthenticated ? (
            // Menu pour utilisateurs connectés
            <>
              <Link href="/">
                <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer">
                  Dashboard
                </button>
              </Link>
              <Link href="/profile">
                <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer">
                  Profile
                </button>
              </Link>
              <Link href="/reservations">
                <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer">
                  My Reservations
                </button>
              </Link>
              <div className="text-white text-sm">
                Welcome, {user?.user_metadata?.full_name || user?.email}!
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            // Menu pour utilisateurs non connectés
            <>
              <Link href="/login">
                <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer">
                  Login
                </button>
              </Link>
              <Link href="/about">
                <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer">
                  About
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
