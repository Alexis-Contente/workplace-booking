"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useUserProfile } from "../../hooks/useUserProfile";
import { supabase } from "../../lib/supabase";
import ProtectedRoute from "../../components/ProtectedRoute";
import Header from "../../components/header";
import Footer from "../../components/footer";
import Link from "next/link";

export default function Profile() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const [editing, setEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    thisMonth: 0,
    lastLogin: "",
  });

  // Fetch booking statistics
  const fetchBookingStats = async () => {
    if (!user) return;

    try {
      // Total bookings
      const { count: totalCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Monthly bookings (current month)
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { count: monthlyCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("booking_date", `${currentMonth}-01`)
        .lt("booking_date", `${currentMonth}-32`);

      setBookingStats({
        total: totalCount || 0,
        thisMonth: monthlyCount || 0,
        lastLogin: user.last_sign_in_at
          ? new Date(user.last_sign_in_at).toLocaleDateString()
          : "Today",
      });
    } catch (err) {
      console.error("Error fetching booking stats:", err);
    }
  };

  // Save changes
  const handleSave = async () => {
    if (!profile || (!editFirstName.trim() && !editLastName.trim())) return;

    setSaveLoading(true);
    setError(null);

    try {
      const firstName = editFirstName.trim() || profile.first_name || "";
      const lastName = editLastName.trim() || profile.last_name || "";

      const { error: updateError } = await supabase
        .from("users")
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq("id", profile.id);

      if (updateError) {
        setError("Failed to update profile");
      } else {
        const updatedProfile = {
          ...profile,
          first_name: firstName,
          last_name: lastName,
        };
        updateProfile(updatedProfile);
        setEditing(false);
        setSuccessMessage("Profile updated successfully! ✅");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Profile update error:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Cancel changes
  const handleCancel = () => {
    setEditFirstName(profile?.first_name || "");
    setEditLastName(profile?.last_name || "");
    setEditing(false);
    setError(null);
  };

  // Initialize edit names when profile is loaded
  useEffect(() => {
    if (profile && !editing) {
      setEditFirstName(profile.first_name || "");
      setEditLastName(profile.last_name || "");
    }
  }, [profile, editing]);

  // Fetch stats when user is loaded
  useEffect(() => {
    if (user) {
      fetchBookingStats();
    }
  }, [user]);

  if (profileLoading) {
    return (
      <ProtectedRoute>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading profile</p>
            <Link href="/" className="text-blue-500 hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                My Profile
              </h1>
              <p className="text-gray-600">
                Manage your personal information and view your booking
                statistics
              </p>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main information */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Personal Information
                      </h2>
                      {!editing && (
                        <button
                          onClick={() => setEditing(true)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">📧</span>
                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex-1">
                          {profile.email}
                        </p>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Your email cannot be changed for security reasons.
                      </p>
                    </div>

                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">👤</span>
                        {editing ? (
                          <input
                            type="text"
                            value={editFirstName}
                            onChange={(e) => setEditFirstName(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your first name"
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex-1">
                            {profile.first_name || "Not set"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">👥</span>
                        {editing ? (
                          <input
                            type="text"
                            value={editLastName}
                            onChange={(e) => setEditLastName(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your last name"
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex-1">
                            {profile.last_name || "Not set"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Member since */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Member Since
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">📅</span>
                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex-1">
                          {profile.created_at
                            ? new Date(profile.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )
                            : "Recently"}
                        </p>
                      </div>
                    </div>

                    {/* Edit buttons */}
                    {editing && (
                      <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={handleSave}
                          disabled={saveLoading}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
                        >
                          {saveLoading ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-6">
                {/* Booking statistics */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    📊 Booking Statistics
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Bookings
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {bookingStats.total}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">This Month</span>
                      <span className="text-lg font-bold text-green-600">
                        {bookingStats.thisMonth}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Last Login
                        </span>
                        <span className="text-sm text-gray-900">
                          {bookingStats.lastLogin}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    ⚡ Quick Actions
                  </h3>

                  <div className="space-y-3">
                    <Link
                      href="/"
                      className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center py-2 rounded-md transition-colors"
                    >
                      🏠 Go to Dashboard
                    </Link>

                    <Link
                      href="/reservations"
                      className="block w-full bg-green-500 hover:bg-green-600 text-white text-center py-2 rounded-md transition-colors"
                    >
                      📅 My Reservations
                    </Link>
                  </div>
                </div>

                {/* Security */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    🔒 Account Security
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Password</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Secure
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">
                      Password changes can be made through your email settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  );
}
