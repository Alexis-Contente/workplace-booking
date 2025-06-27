"use client";

import { useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import Header from "./components/header";
import Footer from "./components/footer";
import DateSelector from "../components/DateSelector";
import DeskGrid from "../components/DeskGrid";

export default function Home() {
  // État pour la date sélectionnée (par défaut aujourd'hui)
  const [selectedDate, setSelectedDate] = useState(() => {
    // Date d'aujourd'hui par défaut
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [refreshKey, setRefreshKey] = useState(0);

  // Callback pour rafraîchir les données quand une réservation change
  const handleBookingChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome to Quant Cube Workplace Booking! 🏢
              </h1>
              <p className="mt-2 text-gray-600">
                Book your desk for productive work in our open office
                environment.
              </p>
            </div>

            {/* Quick stats or notifications could go here */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-blue-500 text-xl mr-3">💡</span>
                <div>
                  <p className="text-blue-800 font-medium">Tip:</p>
                  <p className="text-blue-700 text-sm">
                    Click on available desks (green) to book them, or click on
                    your bookings (blue) to cancel them.
                  </p>
                </div>
              </div>
            </div>

            {/* Date Selector */}
            <div className="mb-8">
              <DateSelector
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>

            {/* Desk Grid - The main feature */}
            <div key={refreshKey}>
              <DeskGrid
                selectedDate={selectedDate}
                onBookingChange={handleBookingChange}
              />
            </div>

            {/* Quick actions or upcoming features */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  📅 Your Upcoming Bookings
                </h3>
                <p className="text-gray-600 text-sm">
                  Coming soon: View all your future reservations at a glance.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  📊 Desk Analytics
                </h3>
                <p className="text-gray-600 text-sm">
                  Coming soon: See usage patterns and popular desk locations.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  🔔 Smart Notifications
                </h3>
                <p className="text-gray-600 text-sm">
                  Coming soon: Get notified when your favorite desks become
                  available.
                </p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
