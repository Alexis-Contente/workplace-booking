"use client";

import { useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DateSelector from "../components/DateSelector";
import DeskGrid from "../components/DeskGrid";

export default function Home() {
  // State for the selected date
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default date is tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });

  const [refreshKey, setRefreshKey] = useState(0);

  // Callback to refresh data when a booking changes
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
                Welcome to QuantCube Workplace Booking 🏢
              </h1>
              <p className="mt-2 text-gray-600">
                Book your desk for productive work in our open office
                environment.
              </p>
            </div>

            {/* Date Selector */}
            <div className="mb-8">
              <DateSelector
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>

            {/* Desk Grid */}
            <div key={refreshKey}>
              <DeskGrid
                selectedDate={selectedDate}
                onBookingChange={handleBookingChange}
              />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
