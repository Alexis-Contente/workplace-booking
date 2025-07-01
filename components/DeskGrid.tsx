"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getDesksWithStatus,
  createBooking,
  cancelBooking,
} from "../lib/desk-helpers";
import type { DeskWithStatus } from "../lib/desk-helpers";

// TYPES
type DeskGridProps = {
  selectedDate: string;
  onBookingChange?: () => void; // Callback to refresh data when a booking changes
};

type DeskButtonProps = {
  desk: DeskWithStatus; // Desk with status
  onBook: (deskId: string) => void; // Function to book a desk
  onCancel: (bookingId: string) => void; // Function to cancel a booking
  isLoading: boolean; // Loading state
  isBookingInProgress: boolean; // Booking in progress state
};

// Desk button component
function DeskButton({
  desk,
  onBook,
  onCancel,
  isLoading,
  isBookingInProgress,
}: DeskButtonProps) {
  const getStatusStyle = () => {
    // If booking in progress, display in blue
    if (isBookingInProgress && desk.status === "available") {
      return "bg-blue-100 border-blue-300 text-blue-800 animate-pulse";
    }

    switch (desk.status) {
      case "available":
        return "bg-green-100 border-green-300 text-green-800 hover:bg-green-200"; // Available desk
      case "booked":
        return "bg-red-100 border-red-300 text-red-800 cursor-not-allowed"; // Booked desk
      case "my_booking":
        return "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200"; // My booking
      default:
        return "bg-gray-100 border-gray-300 text-gray-800"; // Default
    }
  };

  const getStatusIcon = () => {
    // If booking in progress, display the booking icon
    if (isBookingInProgress && desk.status === "available") {
      return "⏳";
    }

    switch (desk.status) {
      case "available":
        return "✅"; // Available desk
      case "booked":
        return "❌"; // Booked desk
      case "my_booking":
        return "💙"; // My booking
      default:
        return "❓"; // Default
    }
  };

  // Function to handle desk click
  const handleClick = () => {
    if (isLoading || isBookingInProgress) return;

    if (desk.status === "available") {
      onBook(desk.id);
    } else if (desk.status === "my_booking" && desk.booking) {
      onCancel(desk.booking.id);
    }
  };

  // Function to check if the desk is clickable
  const isClickable =
    desk.status === "available" || desk.status === "my_booking";

  return (
    <button
      onClick={handleClick}
      disabled={!isClickable || isLoading || isBookingInProgress}
      className={`
        p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium
        ${getStatusStyle()}
        ${isLoading || isBookingInProgress ? "opacity-75 cursor-wait" : ""}
        ${
          isClickable && !isLoading && !isBookingInProgress
            ? "transform hover:scale-105"
            : ""
        }
      `}
      title={
        isBookingInProgress
          ? "Booking in progress..."
          : desk.status === "available"
          ? `Click to book ${desk.name}`
          : desk.status === "my_booking"
          ? `Your booking - Click to cancel`
          : `Booked by someone else`
      }
    >
      <div className="flex flex-col items-center space-y-1">
        <span className="text-lg">{getStatusIcon()}</span>
        <span className="font-bold">{desk.name}</span>
        {isBookingInProgress && desk.status === "available" && (
          <span className="text-xs opacity-75">Booking...</span>
        )}
        {desk.status === "booked" && desk.booking?.users && (
          <span className="text-xs opacity-75">
            {`${desk.booking.users.first_name} ${desk.booking.users.last_name}`.trim()}
          </span>
        )}
      </div>
    </button>
  );
}

export default function DeskGrid({
  selectedDate,
  onBookingChange,
}: DeskGridProps) {
  const { user } = useAuth();

  // States
  const [desks, setDesks] = useState<DeskWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(
    null
  ); // ID of the desk in progress
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch desks and their status
  const fetchDesks = async () => {
    setLoading(true);
    setError(null);

    try {
      const { desks: fetchedDesks, error: fetchError } =
        await getDesksWithStatus(selectedDate, user?.id);

      if (fetchError) {
        setError("Failed to load desk availability");
        console.error("Error fetching desks:", fetchError);
      } else {
        setDesks(fetchedDesks);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Book a desk
  const handleBookDesk = async (deskId: string) => {
    setActionLoading(true);
    setBookingInProgress(deskId); // Mark the desk as in progress
    setError(null); // Reset errors
    setSuccessMessage(null); // Reset success messages

    try {
      // Last minute check: is the desk still available?
      const { desks: currentDesks, error: checkError } =
        await getDesksWithStatus(selectedDate, user?.id);

      if (checkError) {
        setError("Failed to verify desk availability");
        return;
      }

      const targetDesk = currentDesks.find((d) => d.id === deskId);
      if (!targetDesk || targetDesk.status !== "available") {
        setError("This desk is no longer available! Refreshing...");
        await fetchDesks();
        return;
      }

      // Proceed to the booking
      const { booking, error: bookError } = await createBooking(
        deskId,
        selectedDate
      );

      if (bookError) {
        // Specific booking conflict management
        const errorMessage =
          bookError.message || bookError.toString() || "Unknown error";

        // Can't book more than one desk per day
        if (bookError.code === "USER_BOOKING_LIMIT_EXCEEDED") {
          setError(
            "You already have a booking for this date. Only one booking per day is allowed."
          );
        } else if (
          errorMessage.includes("duplicate key") ||
          errorMessage.includes("unique constraint") ||
          errorMessage.includes("bookings_desk_id_booking_date_key")
        ) {
          setError(
            "This desk was just booked by someone else! Refreshing availability..."
          );
          // Refresh immediately to see the new status
          await fetchDesks();
        } else {
          setError("Failed to book desk: " + errorMessage);
        }
      } else if (booking) {
        // Success - refresh the data
        await fetchDesks();
        onBookingChange?.();
        // Temporary success message
        setSuccessMessage(`Desk ${targetDesk.name} booked successfully! 🎉`);
        // Clear the success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Unexpected booking error:", err);
    } finally {
      setActionLoading(false);
      setBookingInProgress(null); // Reset the state
    }
  };

  // Cancel a booking
  const handleCancelBooking = async (bookingId: string) => {
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { success, error: cancelError } = await cancelBooking(bookingId);

      if (cancelError || !success) {
        setError("Failed to cancel booking");
        console.error("Cancel error:", cancelError);
      } else {
        // Refresh the data
        await fetchDesks();
        onBookingChange?.();
        // Success message
        setSuccessMessage("Booking cancelled successfully! ✅");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Unexpected cancel error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Reload when the date changes
  useEffect(() => {
    fetchDesks();
  }, [selectedDate, user?.id]);

  // Separate desks by zone
  const zoneADesks = desks.filter((desk) => desk.location.includes("Zone A"));
  const zoneBDesks = desks.filter((desk) => desk.location.includes("Zone B"));

  // Statistiques
  const stats = {
    total: desks.length,
    available: desks.filter((d) => d.status === "available").length,
    booked: desks.filter((d) => d.status === "booked").length,
    myBookings: desks.filter((d) => d.status === "my_booking").length,
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-8 gap-3">
            {Array.from({ length: 64 }, (_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Tip section */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip :</strong> Click on available desks (green) to book
          them, or click on your bookings (blue) to cancel them.
        </p>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          🪑 Desk Availability for {selectedDate}
        </h2>

        {/* Statistics */}
        <div className="flex gap-4 text-sm">
          <span className="text-green-600">
            ✅ Available: {stats.available}
          </span>
          <span className="text-red-600">❌ Booked: {stats.booked}</span>
          <span className="text-blue-600">
            💙 Your bookings: {stats.myBookings}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={fetchDesks}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Zone A */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-700">
            🏢 Zone A ({zoneADesks.length} desks)
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {zoneADesks.map((desk) => (
              <DeskButton
                key={desk.id}
                desk={desk}
                onBook={handleBookDesk}
                onCancel={handleCancelBooking}
                isLoading={actionLoading}
                isBookingInProgress={bookingInProgress === desk.id}
              />
            ))}
          </div>
        </div>

        {/* Zone B */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-700">
            🏢 Zone B ({zoneBDesks.length} desks)
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {zoneBDesks.map((desk) => (
              <DeskButton
                key={desk.id}
                desk={desk}
                onBook={handleBookDesk}
                onCancel={handleCancelBooking}
                isLoading={actionLoading}
                isBookingInProgress={bookingInProgress === desk.id}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h4 className="font-medium text-gray-700 mb-2">Legend:</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-100 border border-green-300 rounded"></span>
            Available - Click to book
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 bg-red-100 border border-red-300 rounded"></span>
            Booked by colleague
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></span>
            Your booking - Click to cancel
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-100 border border-blue-300 rounded animate-pulse"></span>
            Booking in progress...
          </span>
        </div>
      </div>
    </div>
  );
}
