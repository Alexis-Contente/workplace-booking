"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import Header from "../../components/header";
import Footer from "../../components/footer";
import GlobalBookingsTable from "../../components/GlobalBookingsTable";
import Link from "next/link";

export default function GlobalBookingsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Global view of bookings 📊
                  </h1>
                  <p className="mt-2 text-gray-600">
                    View all bookings for the current week, organized by user
                    and by day.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Link
                    href="/reservations"
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors text-sm"
                  >
                    My bookings
                  </Link>
                  <Link
                    href="/"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors text-sm"
                  >
                    Book a desk
                  </Link>
                </div>
              </div>
            </div>

            {/* Global bookings table */}
            <GlobalBookingsTable />
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
