"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import {
  getDesksWithStatus,
  createBooking,
  cancelBooking,
} from "../lib/desk-helpers";
import type { DeskWithStatus } from "../lib/desk-helpers";
import { LoadingSpinner } from "./ui/Spinner";

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
  userHasAssignedDesk: boolean; // Whether user has a permanently assigned desk
};

// Desk button component
function DeskButton({
  desk,
  onBook,
  onCancel,
  isLoading,
  isBookingInProgress,
  userHasAssignedDesk,
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
      case "assigned":
        return "bg-orange-100 border-orange-300 text-orange-800 cursor-not-allowed"; // Assigned to someone else
      case "my_assigned":
        return "bg-purple-100 border-purple-300 text-purple-800"; // My assigned desk (not bookable)
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
      case "assigned":
        return "🔒"; // Assigned to someone else
      case "my_assigned":
        return "👤"; // My assigned desk
      default:
        return "❓"; // Default
    }
  };

  // Function to handle desk click
  const handleClick = () => {
    if (isLoading || isBookingInProgress) return;

    // If user has assigned desk, they cannot book other desks
    if (userHasAssignedDesk && desk.status === "available") {
      return; // Do nothing - booking disabled
    }

    if (desk.status === "available") {
      onBook(desk.id);
    } else if (desk.status === "my_booking" && desk.booking) {
      onCancel(desk.booking.id);
    }
    // Note: "assigned" and "my_assigned" desks are not clickable for booking
  };

  // Function to check if the desk is clickable
  const isClickable =
    (desk.status === "available" && !userHasAssignedDesk) ||
    desk.status === "my_booking";

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
          : desk.status === "assigned"
          ? `Permanently assigned to ${desk.assigned_user?.first_name} ${desk.assigned_user?.last_name}`
          : desk.status === "my_assigned"
          ? `Your desk`
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
        {desk.status === "assigned" && desk.assigned_user && (
          <span className="text-xs opacity-75">
            {`${desk.assigned_user.first_name} ${desk.assigned_user.last_name}`.trim()}
          </span>
        )}
        {desk.status === "my_assigned" && (
          <span className="text-xs opacity-75">Your desk</span>
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
  const [selectedRoom, setSelectedRoom] = useState<"DS" | "OP" | "IT">("DS"); // New state for room selection

  // Fetch desks and their status
  const fetchDesks = async () => {
    setLoading(true);

    try {
      const { desks: fetchedDesks, error: fetchError } =
        await getDesksWithStatus(selectedDate, user?.id);

      if (fetchError) {
        toast.error("❌ Error loading", {
          description: "Impossible to load the desk availability",
        });
        console.error("Error fetching desks:", fetchError);
      } else {
        setDesks(fetchedDesks);
      }
    } catch (err) {
      toast.error("❌ Unexpected error", {
        description: "An unexpected error occurred",
      });
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Book a desk
  const handleBookDesk = async (deskId: string) => {
    setActionLoading(true);
    setBookingInProgress(deskId); // Mark the desk as in progress

    try {
      // Last minute check: is the desk still available?
      const { desks: currentDesks, error: checkError } =
        await getDesksWithStatus(selectedDate, user?.id);

      if (checkError) {
        toast.error("❌ Error checking", {
          description: "Impossible to check the desk availability",
        });
        return;
      }

      const targetDesk = currentDesks.find((d) => d.id === deskId);
      if (!targetDesk || targetDesk.status !== "available") {
        toast.error("❌ Desk not available", {
          description: "This desk is no longer available! Refreshing...",
        });
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
          toast.error("❌ Booking limit exceeded", {
            description:
              "You already have a booking for this date. Only one booking per day is allowed.",
          });
        } else if (
          errorMessage.includes("duplicate key") ||
          errorMessage.includes("unique constraint") ||
          errorMessage.includes("bookings_desk_id_booking_date_key")
        ) {
          toast.error("❌ Desk already booked", {
            description:
              "This desk was just booked by someone else! Refreshing...",
          });
          // Refresh immediately to see the new status
          await fetchDesks();
        } else {
          toast.error("❌ Booking error", {
            description: "Impossible to book the desk: " + errorMessage,
          });
        }
      } else if (booking) {
        // Success - refresh the data
        await fetchDesks();
        onBookingChange?.();
        // Success message
        toast.success("✅ Booking confirmed", {
          description: `Desk ${targetDesk.name} booked successfully! 🎉`,
        });
      }
    } catch (err) {
      toast.error("❌ Unexpected error", {
        description: "An unexpected error occurred",
      });
      console.error("Unexpected booking error:", err);
    } finally {
      setActionLoading(false);
      setBookingInProgress(null); // Reset the state
    }
  };

  // Cancel a booking
  const handleCancelBooking = async (bookingId: string) => {
    setActionLoading(true);

    try {
      const { success, error: cancelError } = await cancelBooking(bookingId);

      if (cancelError || !success) {
        toast.error("❌ Error cancelling", {
          description: "Impossible to cancel the booking",
        });
        console.error("Cancel error:", cancelError);
      } else {
        // Refresh the data
        await fetchDesks();
        onBookingChange?.();
        // Success message
        toast.success("✅ Booking cancelled", {
          description: "Booking cancelled successfully! ✅",
        });
      }
    } catch (err) {
      toast.error("❌ Unexpected error", {
        description: "An unexpected error occurred",
      });
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
  const zoneCDesks = desks.filter((desk) => desk.location.includes("Zone C"));

  // Room assignments based on zones
  const dsRoomDesks = zoneADesks; // DS Room = Zone A (A01-A24)
  const opRoomDesks = zoneBDesks; // OP Room = Zone B (B01-B16)
  const itRoomDesks = zoneCDesks; // IT Room = Zone C (C01-C14)

  // Get desks for selected room
  const currentRoomDesks =
    selectedRoom === "DS"
      ? dsRoomDesks
      : selectedRoom === "OP"
      ? opRoomDesks
      : itRoomDesks;

  // Check if current user has an assigned desk (to disable booking buttons)
  const userHasAssignedDesk = desks.some(
    (desk) => desk.assigned_to_user_id === user?.id
  );

  // Statistiques
  const stats = {
    total: currentRoomDesks.length,
    available: currentRoomDesks.filter((d) => d.status === "available").length,
    booked: currentRoomDesks.filter((d) => d.status === "booked").length,
    myBookings: currentRoomDesks.filter((d) => d.status === "my_booking")
      .length,
  };

  // Function to render DS Room layout (4 blocks of 3 rows with 2 desks each, landscape orientation)
  const renderDSRoomLayout = () => {
    const blocks = [];

    for (let blockIndex = 0; blockIndex < 4; blockIndex++) {
      const blockDesks = [];

      // Each block has 3 rows of 2 desks (landscape orientation)
      for (let row = 0; row < 3; row++) {
        const rowDesks = [];
        for (let col = 0; col < 2; col++) {
          // Calculate desk index for landscape layout:
          // A01,A02,A03 in first column, A04,A05,A06 in second column, etc.
          const deskIndex = blockIndex * 6 + col * 3 + (2 - row); // (2 - row) for reverse order
          if (deskIndex < dsRoomDesks.length) {
            const desk = dsRoomDesks[deskIndex];
            rowDesks.push(
              <DeskButton
                key={desk.id}
                desk={desk}
                onBook={handleBookDesk}
                onCancel={handleCancelBooking}
                isLoading={actionLoading}
                isBookingInProgress={bookingInProgress === desk.id}
                userHasAssignedDesk={userHasAssignedDesk}
              />
            );
          }
        }
        if (rowDesks.length > 0) {
          blockDesks.push(
            <div
              key={`block-${blockIndex}-row-${row}`}
              className="flex gap-3 justify-center"
            >
              {rowDesks}
            </div>
          );
        }
      }

      if (blockDesks.length > 0) {
        blocks.push(
          <div key={`block-${blockIndex}`} className="flex flex-col gap-2">
            {blockDesks}
          </div>
        );
      }
    }

    return <div className="flex flex-wrap gap-8 justify-center">{blocks}</div>;
  };

  // Function to render OP Room layout (specific layout with top row and side columns)
  const renderOPRoomLayout = () => {
    // Create the specific layout structure
    const topRowDesks: DeskWithStatus[] = []; // B13-B16 (top row)
    const leftColumnDesks: DeskWithStatus[] = []; // B01-B06 (organized in landscape)
    const rightColumnDesks: DeskWithStatus[] = []; // B07-B12 (organized in landscape)

    // Map desks to their positions (assuming desks are ordered sequentially)
    for (let i = 0; i < 16 && i < opRoomDesks.length; i++) {
      const desk = opRoomDesks[i];
      if (i >= 12) {
        // Top row: B13-B16 (last 4 desks)
        topRowDesks.push(desk);
      } else if (i < 6) {
        // Left column: B01-B06 (first 6 desks)
        leftColumnDesks.push(desk);
      } else {
        // Right column: B07-B12 (middle 6 desks)
        rightColumnDesks.push(desk);
      }
    }

    // Render left column in landscape (3 rows x 2 cols)
    const renderLeftColumn = () => {
      const rows = [];
      for (let row = 0; row < 3; row++) {
        const rowDesks = [];
        for (let col = 0; col < 2; col++) {
          const deskIndex = col * 3 + (2 - row); // landscape orientation: reverse row order
          if (deskIndex < leftColumnDesks.length) {
            rowDesks.push(
              <DeskButton
                key={leftColumnDesks[deskIndex]?.id || `left-${deskIndex}`}
                desk={leftColumnDesks[deskIndex]}
                onBook={handleBookDesk}
                onCancel={handleCancelBooking}
                isLoading={actionLoading}
                isBookingInProgress={
                  bookingInProgress === leftColumnDesks[deskIndex]?.id
                }
                userHasAssignedDesk={userHasAssignedDesk}
              />
            );
          }
        }
        if (rowDesks.length > 0) {
          rows.push(
            <div key={`left-row-${row}`} className="flex gap-3">
              {rowDesks}
            </div>
          );
        }
      }
      return <div className="flex flex-col gap-2">{rows}</div>;
    };

    // Render right column in landscape (3 rows x 2 cols)
    const renderRightColumn = () => {
      const rows = [];
      for (let row = 0; row < 3; row++) {
        const rowDesks = [];
        for (let col = 0; col < 2; col++) {
          const deskIndex = col * 3 + (2 - row); // landscape orientation: reverse row order
          if (deskIndex < rightColumnDesks.length) {
            rowDesks.push(
              <DeskButton
                key={rightColumnDesks[deskIndex]?.id || `right-${deskIndex}`}
                desk={rightColumnDesks[deskIndex]}
                onBook={handleBookDesk}
                onCancel={handleCancelBooking}
                isLoading={actionLoading}
                isBookingInProgress={
                  bookingInProgress === rightColumnDesks[deskIndex]?.id
                }
                userHasAssignedDesk={userHasAssignedDesk}
              />
            );
          }
        }
        if (rowDesks.length > 0) {
          rows.push(
            <div key={`right-row-${row}`} className="flex gap-3">
              {rowDesks}
            </div>
          );
        }
      }
      return <div className="flex flex-col gap-2">{rows}</div>;
    };

    return (
      <div className="flex flex-col items-center gap-6">
        {/* Top row: B13-B16 */}
        <div className="flex gap-3">
          {topRowDesks.map((desk, index) => (
            <DeskButton
              key={desk?.id || `top-${index}`}
              desk={desk}
              onBook={handleBookDesk}
              onCancel={handleCancelBooking}
              isLoading={actionLoading}
              isBookingInProgress={bookingInProgress === desk?.id}
              userHasAssignedDesk={userHasAssignedDesk}
            />
          ))}
        </div>

        {/* Bottom section: Left and Right columns with space in middle */}
        <div className="flex gap-16">
          {/* Left column: B01-B06 */}
          {renderLeftColumn()}

          {/* Right column: B07-B12 */}
          {renderRightColumn()}
        </div>
      </div>
    );
  };

  // Function to render IT Room layout (specific layout with left and right columns)
  const renderITRoomLayout = () => {
    // Create the specific layout structure for IT Room
    const leftColumnDesks: DeskWithStatus[] = []; // C01-C08 (8 desks, 4 rows x 2 cols)
    const rightColumnDesks: DeskWithStatus[] = []; // C09-C14 (6 desks, 3 rows x 2 cols)

    // Map desks to their positions (assuming desks are ordered sequentially)
    for (let i = 0; i < 14 && i < itRoomDesks.length; i++) {
      const desk = itRoomDesks[i];
      if (i < 8) {
        // Left column: C01-C08 (first 8 desks)
        leftColumnDesks.push(desk);
      } else {
        // Right column: C09-C14 (last 6 desks)
        rightColumnDesks.push(desk);
      }
    }

    // Render left column in landscape (4 rows x 2 cols)
    const renderLeftColumn = () => {
      const rows = [];
      for (let row = 0; row < 4; row++) {
        const rowDesks = [];
        for (let col = 0; col < 2; col++) {
          const deskIndex = col * 4 + (3 - row); // landscape orientation: reverse row order
          if (deskIndex < leftColumnDesks.length) {
            rowDesks.push(
              <DeskButton
                key={leftColumnDesks[deskIndex]?.id || `it-left-${deskIndex}`}
                desk={leftColumnDesks[deskIndex]}
                onBook={handleBookDesk}
                onCancel={handleCancelBooking}
                isLoading={actionLoading}
                isBookingInProgress={
                  bookingInProgress === leftColumnDesks[deskIndex]?.id
                }
                userHasAssignedDesk={userHasAssignedDesk}
              />
            );
          }
        }
        if (rowDesks.length > 0) {
          rows.push(
            <div key={`it-left-row-${row}`} className="flex gap-3">
              {rowDesks}
            </div>
          );
        }
      }
      return <div className="flex flex-col gap-2">{rows}</div>;
    };

    // Render right column in landscape (3 rows x 2 cols)
    const renderRightColumn = () => {
      const rows = [];
      for (let row = 0; row < 3; row++) {
        const rowDesks = [];
        for (let col = 0; col < 2; col++) {
          const deskIndex = col * 3 + (2 - row); // landscape orientation: reverse row order
          if (deskIndex < rightColumnDesks.length) {
            rowDesks.push(
              <DeskButton
                key={rightColumnDesks[deskIndex]?.id || `it-right-${deskIndex}`}
                desk={rightColumnDesks[deskIndex]}
                onBook={handleBookDesk}
                onCancel={handleCancelBooking}
                isLoading={actionLoading}
                isBookingInProgress={
                  bookingInProgress === rightColumnDesks[deskIndex]?.id
                }
                userHasAssignedDesk={userHasAssignedDesk}
              />
            );
          }
        }
        if (rowDesks.length > 0) {
          rows.push(
            <div key={`it-right-row-${row}`} className="flex gap-3">
              {rowDesks}
            </div>
          );
        }
      }
      return <div className="flex flex-col gap-2">{rows}</div>;
    };

    return (
      <div className="flex gap-16 justify-center">
        {/* Left column: C01-C08 */}
        {renderLeftColumn()}

        {/* Right column: C09-C14 */}
        {renderRightColumn()}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <LoadingSpinner loading={true} size="large" className="min-h-96">
          <div></div>
        </LoadingSpinner>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Tip section */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Click on the available desks (green) to book
          them, or click on your bookings (blue) to cancel them.
        </p>
      </div>

      {/* Room Toggle */}
      <div className="mb-6 flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setSelectedRoom("DS")}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              selectedRoom === "DS"
                ? "bg-white text-blue-600 shadow-md"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            DS Room
          </button>
          <button
            onClick={() => setSelectedRoom("OP")}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              selectedRoom === "OP"
                ? "bg-white text-blue-600 shadow-md"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            OP Room
          </button>
          <button
            onClick={() => setSelectedRoom("IT")}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              selectedRoom === "IT"
                ? "bg-white text-blue-600 shadow-md"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            IT Room
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          🪑 Desk availability for{" "}
          {selectedRoom === "DS"
            ? "DS Room"
            : selectedRoom === "OP"
            ? "OP Room"
            : "IT Room"}{" "}
          - {selectedDate}
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

      {/* Room Layout */}
      <div className="mb-6">
        {selectedRoom === "DS"
          ? renderDSRoomLayout()
          : selectedRoom === "OP"
          ? renderOPRoomLayout()
          : renderITRoomLayout()}
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
            Booked by a colleague
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></span>
            Your booking - Click to cancel
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></span>
            Assigned to a colleague
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></span>
            Your assigned desk
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
