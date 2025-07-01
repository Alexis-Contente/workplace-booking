import { supabase } from "./supabase";
import type { PostgrestError } from "@supabase/supabase-js";

// Types pour TypeScript
export interface Desk {
  id: string;
  name: string;
  description: string;
  location: string;
  is_available: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  desk_id: string;
  booking_date: string;
  status: "active" | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  users?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  desks?: {
    name: string;
  };
}

export interface DeskWithStatus extends Desk {
  status: "available" | "booked" | "my_booking";
  booking?: Booking;
}

// Fonction pour s'assurer qu'un profil utilisateur existe
async function ensureUserProfile(): Promise<{
  success: boolean;
  error: PostgrestError | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: { message: "User not authenticated" } as PostgrestError,
    };
  }

  // Vérifier si le profil existe déjà
  const { data: existingProfile, error: fetchError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // Erreur autre que "pas trouvé"
    return { success: false, error: fetchError };
  }

  if (existingProfile) {
    // Le profil existe déjà
    return { success: true, error: null };
  }

  // Créer le profil utilisateur
  const { error: insertError } = await supabase.from("users").insert({
    id: user.id,
    email: user.email!,
    first_name: user.user_metadata?.first_name || user.email!.split("@")[0],
    last_name: user.user_metadata?.last_name || "",
  });

  return { success: !insertError, error: insertError };
}

// Récupérer tous les bureaux
export async function getAllDesks(): Promise<{
  desks: Desk[];
  error: PostgrestError | null;
}> {
  const { data: desks, error } = await supabase
    .from("desks")
    .select("*")
    .eq("is_available", true)
    .order("name");

  return { desks: desks || [], error };
}

// Récupérer les réservations pour une date spécifique
export async function getBookingsForDate(
  date: string
): Promise<{ bookings: Booking[]; error: PostgrestError | null }> {
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      users:user_id (first_name, last_name, email),
      desks:desk_id (name)
    `
    )
    .eq("booking_date", date)
    .eq("status", "active");

  return { bookings: bookings || [], error };
}

// Récupérer les bureaux avec leur statut pour une date donnée
export async function getDesksWithStatus(
  date: string,
  currentUserId?: string
): Promise<{ desks: DeskWithStatus[]; error: PostgrestError | null }> {
  // Récupérer les bureaux et réservations en parallèle
  const [desksResult, bookingsResult] = await Promise.all([
    getAllDesks(),
    getBookingsForDate(date),
  ]);

  if (desksResult.error) {
    return { desks: [], error: desksResult.error };
  }

  if (bookingsResult.error) {
    return { desks: [], error: bookingsResult.error };
  }

  // Créer un map des réservations par desk_id
  const bookingsByDeskId = new Map<string, Booking>();
  bookingsResult.bookings.forEach((booking) => {
    bookingsByDeskId.set(booking.desk_id, booking);
  });

  // Combiner bureaux et statuts
  const desksWithStatus: DeskWithStatus[] = desksResult.desks.map((desk) => {
    const booking = bookingsByDeskId.get(desk.id);

    let status: "available" | "booked" | "my_booking" = "available";

    if (booking) {
      if (currentUserId && booking.user_id === currentUserId) {
        status = "my_booking";
      } else {
        status = "booked";
      }
    }

    return {
      ...desk,
      status,
      booking,
    };
  });

  return { desks: desksWithStatus, error: null };
}

// Créer une nouvelle réservation
export async function createBooking(
  deskId: string,
  date: string,
  notes?: string
): Promise<{ booking: Booking | null; error: PostgrestError | null }> {
  // S'assurer que le profil utilisateur existe
  const { success: profileSuccess, error: profileError } =
    await ensureUserProfile();

  if (!profileSuccess || profileError) {
    return { booking: null, error: profileError };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      booking: null,
      error: { message: "User not authenticated" } as PostgrestError,
    };
  }

  // Vérifier si l'utilisateur a déjà une réservation pour cette date
  const { data: existingBooking, error: checkError } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", user.id)
    .eq("booking_date", date)
    .eq("status", "active")
    .limit(1);

  if (checkError) {
    return { booking: null, error: checkError };
  }

  if (existingBooking && existingBooking.length > 0) {
    return {
      booking: null,
      error: {
        message:
          "You already have a booking for this date. Only one booking per day is allowed.",
        code: "USER_BOOKING_LIMIT_EXCEEDED",
      } as PostgrestError,
    };
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      desk_id: deskId,
      booking_date: date,
      notes: notes || null,
    })
    .select("*")
    .single();

  return { booking, error };
}

// Annuler une réservation
export async function cancelBooking(
  bookingId: string
): Promise<{ success: boolean; error: PostgrestError | null }> {
  // Supprimer complètement la réservation au lieu de la marquer comme cancelled
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  return { success: !error, error };
}

// Récupérer les réservations d'un utilisateur
export async function getUserBookings(
  userId?: string,
  limit = 10
): Promise<{ bookings: Booking[]; error: PostgrestError | null }> {
  let query = supabase
    .from("bookings")
    .select(
      `
      *,
      desks:desk_id (name, location)
    `
    )
    .eq("status", "active")
    .order("booking_date", { ascending: true })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    // Si pas d'userId fourni, récupérer pour l'utilisateur connecté
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        bookings: [],
        error: { message: "User not authenticated" } as PostgrestError,
      };
    }
    query = query.eq("user_id", user.id);
  }

  const { data: bookings, error } = await query;

  return { bookings: bookings || [], error };
}
