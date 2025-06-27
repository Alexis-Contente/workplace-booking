"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { getUserBookings } from "../../lib/desk-helpers";
import ProtectedRoute from "../../components/ProtectedRoute";
import Header from "../components/header";
import Footer from "../components/footer";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    thisMonth: 0,
    lastLogin: "",
  });

  // Récupérer le profil utilisateur
  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Récupérer le profil depuis la table users
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code === "PGRST116") {
        // Si l'utilisateur n'existe pas dans la table users, le créer
        const { data: newProfile, error: createError } = await supabase
          .from("users")
          .insert({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || user.email!.split("@")[0],
          })
          .select("*")
          .single();

        if (createError) {
          setError("Failed to create user profile");
          return;
        }
        setProfile(newProfile);
        setEditName(newProfile.name);
      } else if (profileError) {
        setError("Failed to load profile");
        return;
      } else if (profileData) {
        setProfile(profileData);
        setEditName(profileData.name);
      }

      // Récupérer les statistiques de réservation
      const { bookings } = await getUserBookings(user.id, 100);
      const now = new Date();
      const thisMonth = bookings.filter((b) => {
        const bookingDate = new Date(b.booking_date);
        return (
          bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getFullYear() === now.getFullYear()
        );
      });

      setBookingStats({
        total: bookings.length,
        thisMonth: thisMonth.length,
        lastLogin: user.last_sign_in_at
          ? new Date(user.last_sign_in_at).toLocaleDateString()
          : "Today",
      });
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!profile || !editName.trim()) return;

    setSaveLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({ name: editName.trim() })
        .eq("id", profile.id);

      if (updateError) {
        setError("Failed to update profile");
      } else {
        setProfile({ ...profile, name: editName.trim() });
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

  // Annuler les modifications
  const handleCancel = () => {
    setEditName(profile?.name || "");
    setEditing(false);
    setError(null);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
                <div className="bg-gray-200 rounded-lg h-64"></div>
              </div>
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                User Profile 👤
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your personal information and view your account
                statistics.
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
              {/* Informations principales */}
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
                          {profile?.email}
                        </p>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Your email cannot be changed for security reasons.
                      </p>
                    </div>

                    {/* Nom */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">👤</span>
                        {editing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your display name"
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex-1">
                            {profile?.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Date d'inscription */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Member Since
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">📅</span>
                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex-1">
                          {profile?.created_at
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

                    {/* Boutons d'édition */}
                    {editing && (
                      <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={handleSave}
                          disabled={saveLoading || !editName.trim()}
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

              {/* Statistiques */}
              <div className="space-y-6">
                {/* Stats de réservation */}
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

                {/* Actions rapides */}
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

                {/* Sécurité */}
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
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
