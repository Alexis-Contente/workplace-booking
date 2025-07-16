"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import {
  getUserBookingsWithCleanup,
  cancelBooking,
} from "../../lib/desk-helpers";
import type { Booking } from "../../lib/desk-helpers";
import ProtectedRoute from "../../components/ProtectedRoute";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";
import { LoadingSpinner } from "../../components/ui/Spinner";

// Extended booking interface with desk relationship data for UI display
interface BookingWithDesk extends Booking {
  desks: {
    name: string;
    location: string;
  };
}

export default function ReservationsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDesk[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch user bookings with automatic cleanup of old records (90+ days)
  const fetchBookings = async () => {
    setLoading(true);

    try {
      const {
        bookings: fetchedBookings,
        cleanupResult,
        error: fetchError,
      } = await getUserBookingsWithCleanup(user?.id, 50);

      if (fetchError) {
        toast.error("Error loading", {
          description: "Impossible to load your reservations",
        });
        console.error("Error fetching bookings:", fetchError);
      } else {
        setBookings(fetchedBookings as BookingWithDesk[]);
        // Log cleanup results for monitoring (visible in browser console)
        if (cleanupResult && cleanupResult.deletedCount > 0) {
          console.log(
            `🧹 Cleaned up ${cleanupResult.deletedCount} old bookings (>90 days)`
          );
        }
      }
    } catch (err) {
      toast.error("Unexpected error", {
        description: "An unexpected error occurred",
      });
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cancel a booking with optimistic UI updates and error handling
  const handleCancelBooking = async (bookingId: string, deskName: string) => {
    setActionLoading(bookingId);

    try {
      const { success, error: cancelError } = await cancelBooking(bookingId);

      if (cancelError || !success) {
        toast.error("Error cancelling", {
          description: "Impossible to cancel the reservation",
        });
        console.error("Cancel error:", cancelError);
      } else {
        // Refresh data and show success message
        await fetchBookings();
        toast.success("Reservation cancelled", {
          description: `Reservation for ${deskName} cancelled successfully!`,
        });
      }
    } catch (err) {
      toast.error("Unexpected error", {
        description: "An unexpected error occurred",
      });
      console.error("Unexpected cancel error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  // Filter bookings into upcoming and past categories based on current date
  const today = new Date().toISOString().split("T")[0];
  const upcomingBookings = bookings.filter((b) => b.booking_date >= today);

  // Calculate statistics for dashboard cards
  const stats = {
    total: bookings.length,
    upcoming: upcomingBookings.length,
    thisWeek: upcomingBookings.filter((b) => {
      const bookingDate = new Date(b.booking_date);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return bookingDate <= nextWeek;
    }).length,
  };

  // Format booking dates with human-readable labels (Today, Tomorrow, etc.)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateString === today.toISOString().split("T")[0]) {
      return "Today";
    } else if (dateString === tomorrow.toISOString().split("T")[0]) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  // Loading state with spinner
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <LoadingSpinner loading={true} size="large" className="min-h-96">
                <div></div>
              </LoadingSpinner>
            </div>
          </main>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page header with title and description */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                My Reservations 📅
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your desk bookings and view your reservation history.
              </p>
            </div>

            {/* Statistics dashboard cards showing booking metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Bookings
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="text-2xl">🗓️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Upcoming
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.upcoming}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <span className="text-2xl">⏰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      This Week
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.thisWeek}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main section: Upcoming reservations with management actions */}
            <div className="bg-white rounded-lg shadow-md mb-8">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">
                    🗓️ Upcoming Reservations ({stats.upcoming})
                  </h2>
                  <Link
                    href="/"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors text-sm"
                  >
                    + Book New Desk
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {/* Empty state when no upcoming bookings exist */}
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">🪑</div>
                    <h3 className="text-lg font-medium mb-2">
                      No upcoming reservations
                    </h3>
                    <p className="text-sm mb-6">
                      Book your next desk to get started!
                    </p>
                    <Link
                      href="/"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md transition-colors"
                    >
                      Book a Desk
                    </Link>
                  </div>
                ) : (
                  // List of upcoming bookings with cancel functionality
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <span className="text-lg">🪑</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Desk {booking.desks.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {booking.desks.location} •{" "}
                              {formatDate(booking.booking_date)}
                            </p>
                            {booking.notes && (
                              <p className="text-xs text-gray-500 mt-1">
                                Note: {booking.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            Booked{" "}
                            {new Date(booking.created_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() =>
                              handleCancelBooking(
                                booking.id,
                                booking.desks.name
                              )
                            }
                            disabled={actionLoading === booking.id}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                          >
                            {actionLoading === booking.id
                              ? "Cancelling..."
                              : "Cancel"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
