import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "../lib/supabase";

// User profile interface matching the database structure
interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

/**
 * Custom hook to manage user profile data
 * Handles fetching, creating, and updating user profiles from Supabase
 */
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      // If no authenticated user, stop loading
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile from the users table
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code === "PGRST116") {
          // If user doesn't exist in our users table, create a new profile
          // Extract first name from email or use metadata
          const firstName =
            user.user_metadata?.first_name || user.email!.split("@")[0];
          const lastName = user.user_metadata?.last_name || "";

          // Create new user profile in database
          const { data: newProfile, error: createError } = await supabase
            .from("users")
            .insert({
              id: user.id,
              email: user.email!,
              first_name: firstName,
              last_name: lastName,
            })
            .select("*")
            .single();

          // If profile created successfully, update state
          if (!createError && newProfile) {
            setProfile(newProfile);
          }
        } else if (!profileError && profileData) {
          // If profile exists and was fetched successfully, update state
          setProfile(profileData);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        // Always set loading to false when done
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]); // Re-run when user changes

  // Function to update profile state (for optimistic updates)
  const updateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  // Helper function to get full name from profile
  const getFullName = () => {
    if (!profile) return "";
    return `${profile.first_name} ${profile.last_name}`.trim();
  };

  // Return profile data and utility functions
  return {
    profile,
    loading,
    updateProfile,
    getFullName,
  };
}
