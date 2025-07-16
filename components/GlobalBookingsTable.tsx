"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getCurrentWeekBookings,
  getCurrentWeekDates,
} from "../lib/desk-helpers";
import type { Booking } from "../lib/desk-helpers";
import { LoadingSpinner } from "./ui/Spinner";

// Interface for the data table
interface WeeklyBookingData {
  bookingsByDate: Record<string, Booking[]>;
  allUsers: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
}

// Function to get the color based on the room/zone
const getRoomColor = (location: string): string => {
  if (location.includes("Zone A")) return "bg-blue-100 text-blue-800"; // DS Room
  if (location.includes("Zone B")) return "bg-green-100 text-green-800"; // OP Room
  if (location.includes("Zone C")) return "bg-purple-100 text-purple-800"; // IT Room
  return "bg-gray-100 text-gray-800"; // Default
};

// Function to get the short name of the room
const getRoomName = (location: string): string => {
  if (location.includes("Zone A")) return "DS";
  if (location.includes("Zone B")) return "OP";
  if (location.includes("Zone C")) return "IT";
  return "?";
};

// Function to format the display date
const formatDayLabel = (dateString: string): string => {
  const date = new Date(dateString);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = dayNames[date.getDay()];
  const dayNumber = date.getDate();
  const monthNumber = date.getMonth() + 1;
  return `${dayName} ${dayNumber}/${monthNumber}`;
};

export default function GlobalBookingsTable() {
  const [data, setData] = useState<WeeklyBookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<"all" | "DS" | "OP" | "IT">(
    "all"
  );

  const weekDates = getCurrentWeekDates();

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        bookingsByDate,
        allUsers,
        error: fetchError,
      } = await getCurrentWeekBookings();

      if (fetchError) {
        setError("Error loading bookings");
        console.error("Error fetching global bookings:", fetchError);
        toast.error("Error loading", {
          description: "Unable to load global bookings",
        });
      } else {
        setData({ bookingsByDate, allUsers });
      }
    } catch (err) {
      setError("Unexpected error");
      console.error("Unexpected error:", err);
      toast.error("Unexpected error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Find the booking for a user for a given date
  const findUserBookingForDate = (
    userId: string,
    date: string
  ): Booking | null => {
    if (!data) return null;

    const bookingsForDate = data.bookingsByDate[date] || [];
    return (
      bookingsForDate.find((booking) => booking.user_id === userId) || null
    );
  };

  // Filter users based on selected room
  const getFilteredUsers = () => {
    if (!data || selectedRoom === "all") return data?.allUsers || [];

    return data.allUsers.filter((user) => {
      // Check if user has any bookings in the selected room this week
      return weekDates.dates.some((date) => {
        const booking = findUserBookingForDate(user.id, date);
        if (!booking) return false;

        const roomName = getRoomName(booking.desks?.location || "");
        return roomName === selectedRoom;
      });
    });
  };

  // Get statistics for the selected room
  const getRoomStats = () => {
    if (!data) return { totalBookings: 0, usersCount: 0 };

    const filteredUsers = getFilteredUsers();
    let totalBookings = 0;

    if (selectedRoom === "all") {
      totalBookings = Object.values(data.bookingsByDate).flat().length;
    } else {
      filteredUsers.forEach((user) => {
        weekDates.dates.forEach((date) => {
          const booking = findUserBookingForDate(user.id, date);
          if (booking) {
            const roomName = getRoomName(booking.desks?.location || "");
            if (roomName === selectedRoom) {
              totalBookings++;
            }
          }
        });
      });
    }

    return {
      totalBookings,
      usersCount: filteredUsers.length,
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <LoadingSpinner loading={true} size="large" className="min-h-96">
          <div></div>
        </LoadingSpinner>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error loading
          </h3>
          <p className="text-gray-600 mb-4">{error || "Unable to load data"}</p>
          <button
            onClick={fetchData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.allUsers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No bookings
          </h3>
          <p className="text-gray-600">No bookings found for this week</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with week info */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            📊 Bookings for the week
          </h2>
          <div className="text-sm text-gray-600">
            {formatDayLabel(weekDates.monday)} -{" "}
            {formatDayLabel(weekDates.friday)}
          </div>
        </div>
      </div>

      {/* Room filters */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Filter by room:
          </span>
          <button
            onClick={() => setSelectedRoom("all")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedRoom === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All Rooms
          </button>
          <button
            onClick={() => setSelectedRoom("DS")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedRoom === "DS"
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            DS Room
          </button>
          <button
            onClick={() => setSelectedRoom("OP")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedRoom === "OP"
                ? "bg-green-600 text-white"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            OP Room
          </button>
          <button
            onClick={() => setSelectedRoom("IT")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedRoom === "IT"
                ? "bg-purple-600 text-white"
                : "bg-purple-100 text-purple-700 hover:bg-purple-200"
            }`}
          >
            IT Room
          </button>
        </div>
      </div>

      {/* Main table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                User
              </th>
              {weekDates.dates.map((date) => (
                <th
                  key={date}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
                >
                  {formatDayLabel(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getFilteredUsers().map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user.first_name[0]}
                        {user.last_name[0]}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                {weekDates.dates.map((date) => {
                  const booking = findUserBookingForDate(user.id, date);

                  return (
                    <td
                      key={date}
                      className="px-6 py-4 whitespace-nowrap text-center"
                    >
                      {booking ? (
                        <div className="flex flex-col items-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoomColor(
                              booking.desks?.location || ""
                            )}`}
                          >
                            {booking.desks?.name || "?"} (
                            {getRoomName(booking.desks?.location || "")})
                          </span>
                          {booking.notes && (
                            <span
                              className="text-xs text-gray-500 mt-1"
                              title={booking.notes}
                            >
                              📝
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with statistics */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            {getRoomStats().usersCount} user
            {getRoomStats().usersCount > 1 ? "s" : ""} with bookings
            {selectedRoom !== "all" && (
              <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                {selectedRoom} Room only
              </span>
            )}
          </span>
          <span>
            {getRoomStats().totalBookings} booking
            {getRoomStats().totalBookings > 1 ? "s" : ""} total
          </span>
        </div>
      </div>
    </div>
  );
}
