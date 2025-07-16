"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUserProfile } from "../../hooks/useUserProfile";
import { supabase } from "../../lib/supabase";
import { validatePassword } from "../../lib/auth-helpers";
import ProtectedRoute from "../../components/ProtectedRoute";
import Header from "../../components/header";
import Footer from "../../components/footer";
import Link from "next/link";

export default function Profile() {
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const [editing, setEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Password change states
  const [changingPassword, setChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  // Save changes
  const handleSave = async () => {
    if (!profile || (!editFirstName.trim() && !editLastName.trim())) return;

    setSaveLoading(true);

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
        toast.error("❌ Error updating", {
          description: "Impossible to update the profile",
        });
      } else {
        const updatedProfile = {
          ...profile,
          first_name: firstName,
          last_name: lastName,
        };
        updateProfile(updatedProfile);
        setEditing(false);
        toast.success("✅ Profile updated", {
          description: "Profile updated successfully!",
        });
      }
    } catch (err) {
      toast.error("❌ Unexpected error", {
        description: "An unexpected error occurred",
      });
      console.error("Profile update error:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Function to check password criteria in real time
  const getPasswordCriteria = (password: string) => {
    return {
      length: password.length >= 14,
      numbers: (password.match(/\d/g) || []).length >= 2,
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!profile || !oldPassword || !newPassword) return;

    setPasswordChangeLoading(true);

    try {
      // First, validate the new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        passwordValidation.errors.forEach((error, index) => {
          setTimeout(() => {
            toast.error("❌ Password validation", {
              description: error,
            });
          }, index * 200);
        });
        setPasswordChangeLoading(false);
        return;
      }

      // Verify old password by attempting to sign in with current credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: oldPassword,
      });

      if (signInError) {
        toast.error("❌ Incorrect password", {
          description: "The old password is incorrect",
        });
        setPasswordChangeLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error("❌ Password change failed", {
          description: updateError.message,
        });
      } else {
        toast.success("✅ Password changed", {
          description: "Your password has been updated successfully!",
        });
        // Reset form
        setOldPassword("");
        setNewPassword("");
        setChangingPassword(false);
      }
    } catch (err) {
      toast.error("❌ Unexpected error", {
        description: "An unexpected error occurred",
      });
      console.error("Password change error:", err);
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  // Cancel password change
  const handleCancelPasswordChange = () => {
    setOldPassword("");
    setNewPassword("");
    setChangingPassword(false);
  };

  // Cancel changes
  const handleCancel = () => {
    setEditFirstName(profile?.first_name || "");
    setEditLastName(profile?.last_name || "");
    setEditing(false);
  };

  // Initialize edit names when profile is loaded
  useEffect(() => {
    if (profile && !editing) {
      setEditFirstName(profile.first_name || "");
      setEditLastName(profile.last_name || "");
    }
  }, [profile, editing]);

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
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="mt-2 text-gray-600">
                Manage your personal information and view your booking
                statistics
              </p>
            </div>

            {/* Main information */}
            <div className="max-w-4xl mx-auto">
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

                  {/* Password Change Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-800">
                        Change Password
                      </h3>
                      {!changingPassword && (
                        <button
                          onClick={() => setChangingPassword(true)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          Change Password
                        </button>
                      )}
                    </div>

                    {changingPassword && (
                      <div className="space-y-4">
                        {/* Old Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Old Password
                          </label>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">🔒</span>
                            <input
                              type="password"
                              value={oldPassword}
                              onChange={(e) => setOldPassword(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter your current password"
                            />
                          </div>
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">🔑</span>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter your new password"
                            />
                          </div>

                          {/* Password Criteria */}
                          {newPassword && (
                            <div className="mt-2 space-y-1">
                              {(() => {
                                const criteria =
                                  getPasswordCriteria(newPassword);
                                return (
                                  <div className="text-xs space-y-1">
                                    <div
                                      className={`flex items-center gap-2 ${
                                        criteria.length
                                          ? "text-green-600"
                                          : "text-red-500"
                                      }`}
                                    >
                                      <span>
                                        {criteria.length ? "✅" : "❌"}
                                      </span>
                                      <span>At least 14 characters</span>
                                    </div>
                                    <div
                                      className={`flex items-center gap-2 ${
                                        criteria.numbers
                                          ? "text-green-600"
                                          : "text-red-500"
                                      }`}
                                    >
                                      <span>
                                        {criteria.numbers ? "✅" : "❌"}
                                      </span>
                                      <span>At least 2 numbers</span>
                                    </div>
                                    <div
                                      className={`flex items-center gap-2 ${
                                        criteria.special
                                          ? "text-green-600"
                                          : "text-red-500"
                                      }`}
                                    >
                                      <span>
                                        {criteria.special ? "✅" : "❌"}
                                      </span>
                                      <span>
                                        At least 1 special character
                                        (!@#$%^&*...)
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Password Change Buttons */}
                        <div className="flex space-x-3 pt-4">
                          <button
                            onClick={handlePasswordChange}
                            disabled={
                              passwordChangeLoading ||
                              !oldPassword ||
                              !newPassword
                            }
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {passwordChangeLoading
                              ? "Changing..."
                              : "Change Password"}
                          </button>
                          <button
                            onClick={handleCancelPasswordChange}
                            disabled={passwordChangeLoading}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
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
