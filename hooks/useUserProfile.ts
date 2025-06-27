import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "../lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Récupérer le profil depuis la table users
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code === "PGRST116") {
          // Si l'utilisateur n'existe pas, le créer avec first_name et last_name
          const firstName =
            user.user_metadata?.first_name || user.email!.split("@")[0];
          const lastName = user.user_metadata?.last_name || "";

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

          if (!createError && newProfile) {
            setProfile(newProfile);
          }
        } else if (!profileError && profileData) {
          setProfile(profileData);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  const updateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  // Fonction helper pour obtenir le nom complet
  const getFullName = () => {
    if (!profile) return "";
    return `${profile.first_name} ${profile.last_name}`.trim();
  };

  return {
    profile,
    loading,
    updateProfile,
    getFullName,
  };
}
