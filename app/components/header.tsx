"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-blue-500 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-white text-4xl font-bold uppercase">
          Workplace Booking
        </h1>
        <div className="flex gap-4">
          <Link href="/">
            <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer">
              Home
            </button>
          </Link>
          <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer">
            Profile
          </button>
          <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer">
            Reservation
          </button>
          <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer">
            About
          </button>
          <Link href="/login">
            <button className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-50 transition-colors cursor-pointer">
              Login
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
