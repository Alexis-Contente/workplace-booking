/**
 * DESK BOOKING SYSTEM - Helper Functions
 *
 * This file contains all the business logic for managing desk bookings in a workplace.
 * It handles:
 * - User profile management
 * - Desk availability checking
 * - Booking creation and cancellation
 * - Automatic cleanup of old bookings (90-day retention)
 * - Usage analytics and statistics
 *
 * The system uses Supabase as the backend database with PostgreSQL.
 */

import { supabase } from "./supabase";
import type { PostgrestError } from "@supabase/supabase-js";

// ============================================================================
// TYPESCRIPT INTERFACES - Data Models
// ============================================================================

/**
 * Desk Entity - Represents a physical desk in the workplace
 * Each desk has availability status and location information
 */
export interface Desk {
  id: string;
  name: string;
  description: string;
  location: string;
  is_available: boolean; // Whether the desk can be booked
  assigned_to_user_id?: string; // If set, desk is permanently assigned to this user
  assignment_note?: string; // Optional note about the assignment
  created_at: string;
}

/**
 * Booking Entity - Represents a user's reservation for a specific desk on a specific date
 * Status can be "active" (valid booking) or "cancelled" (soft delete)
 */
export interface Booking {
  id: string;
  user_id: string;
  desk_id: string;
  booking_date: string; // Format: YYYY-MM-DD
  status: "active" | "cancelled";
  notes?: string; // Optional user notes
  created_at: string;
  updated_at: string;
  // Relational data from joins
  users?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  desks?: {
    name: string;
    location?: string;
  };
}

/**
 * Extended Desk with booking status for UI display
 * Combines desk info with real-time availability status
 */
export interface DeskWithStatus extends Desk {
  status: "available" | "booked" | "my_booking" | "assigned" | "my_assigned";
  booking?: Booking; // If booked, contains the booking details
  assigned_user?: {
    first_name: string;
    last_name: string;
    email: string;
  }; // If assigned, contains the assigned user details
}

// ============================================================================
// USER PROFILE MANAGEMENT
// ============================================================================

/**
 * Ensures that a user profile exists in the database
 *
 * When users authenticate via Supabase Auth, they don't automatically get
 * a profile in our users table. This function creates one if needed.
 *
 * BUSINESS LOGIC:
 * - Check if user is authenticated
 * - Look for existing profile in users table
 * - Create profile if it doesn't exist using auth metadata
 * - Use email prefix as fallback for first_name
 *
 * @returns Promise with success status and any error
 */
async function ensureUserProfile(): Promise<{
  success: boolean;
  error: PostgrestError | null;
}> {
  // Step 1: Get the authenticated user from Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: { message: "User not authenticated" } as PostgrestError,
    };
  }

  // Step 2: Check if user profile already exists in our users table
  const { data: existingProfile, error: fetchError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  // Handle errors (ignore "not found" error code PGRST116)
  if (fetchError && fetchError.code !== "PGRST116") {
    return { success: false, error: fetchError };
  }

  // Step 3: If profile exists, we're done
  if (existingProfile) {
    return { success: true, error: null };
  }

  // Step 4: Create new user profile using auth metadata
  const { error: insertError } = await supabase.from("users").insert({
    id: user.id, // Use same ID as auth user
    email: user.email!,
    // Extract name from metadata or use email prefix as fallback
    first_name: user.user_metadata?.first_name || user.email!.split("@")[0],
    last_name: user.user_metadata?.last_name || "",
  });

  return { success: !insertError, error: insertError };
}

// ============================================================================
// DESK MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Retrieves all available desks from the database
 *
 * BUSINESS LOGIC:
 * - Only return desks that are marked as available (is_available = true)
 * - Include assignment information (assigned user details)
 * - Sort alphabetically by name for consistent UI display
 *
 * @returns Promise with array of desks and any error
 */
export async function getAllDesks(): Promise<{
  desks: Desk[];
  error: PostgrestError | null;
}> {
  const { data: desks, error } = await supabase
    .from("desks")
    .select(
      `
      *,
      assigned_user:assigned_to_user_id (
        first_name,
        last_name,
        email
      )
    `
    )
    .eq("is_available", true) // Filter out disabled desks
    .order("name"); // Sort alphabetically

  return { desks: desks || [], error };
}

/**
 * Gets all active bookings for a specific date
 *
 * BUSINESS LOGIC:
 * - Only return bookings with status "active" (excludes cancelled ones)
 * - Include related user and desk information via joins
 * - Used to check desk availability for a given date
 *
 * @param date - Date in YYYY-MM-DD format
 * @returns Promise with bookings array and any error
 */
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
    .eq("status", "active"); // Only active bookings

  return { bookings: bookings || [], error };
}

/**
 * Combines desk data with real-time booking status for a specific date
 *
 * CORE BUSINESS LOGIC:
 * 1. Fetch all available desks and all bookings for the date in parallel
 * 2. Create a mapping of bookings by desk_id for O(1) lookup
 * 3. For each desk, determine its status:
 *    - "available": No booking for this date
 *    - "booked": Someone else has booked it
 *    - "my_booking": Current user has booked it
 *
 * This is used by the main booking interface to show desk availability.
 *
 * @param date - Target date in YYYY-MM-DD format
 * @param currentUserId - ID of current user (to identify their bookings)
 * @returns Promise with desks including their booking status
 */
export async function getDesksWithStatus(
  date: string,
  currentUserId?: string
): Promise<{ desks: DeskWithStatus[]; error: PostgrestError | null }> {
  // Step 1: Fetch desks and bookings in parallel for better performance
  const [desksResult, bookingsResult] = await Promise.all([
    getAllDesks(),
    getBookingsForDate(date),
  ]);

  // Handle any errors from the parallel requests
  if (desksResult.error) {
    return { desks: [], error: desksResult.error };
  }
  if (bookingsResult.error) {
    return { desks: [], error: bookingsResult.error };
  }

  // Step 2: Create a fast lookup map for bookings by desk_id
  const bookingsByDeskId = new Map<string, Booking>();
  bookingsResult.bookings.forEach((booking) => {
    bookingsByDeskId.set(booking.desk_id, booking);
  });

  // Step 3: Combine desk data with booking status
  const desksWithStatus: DeskWithStatus[] = desksResult.desks.map((desk) => {
    const booking = bookingsByDeskId.get(desk.id);

    // Determine desk status with priority order:
    // 1. Assignment status (highest priority)
    // 2. Booking status
    // 3. Available (default)
    let status:
      | "available"
      | "booked"
      | "my_booking"
      | "assigned"
      | "my_assigned" = "available";

    // Check if desk is permanently assigned
    if (desk.assigned_to_user_id) {
      if (currentUserId && desk.assigned_to_user_id === currentUserId) {
        status = "my_assigned"; // User's own assigned desk
      } else {
        status = "assigned"; // Assigned to someone else
      }
    }
    // If not assigned, check for bookings
    else if (booking) {
      if (currentUserId && booking.user_id === currentUserId) {
        status = "my_booking"; // User's own booking
      } else {
        status = "booked"; // Someone else's booking
      }
    }

    return {
      ...desk,
      status,
      booking, // Include booking details if it exists
      assigned_user: (
        desk as Desk & {
          assigned_user?: {
            first_name: string;
            last_name: string;
            email: string;
          };
        }
      ).assigned_user, // Include assigned user details
    };
  });

  return { desks: desksWithStatus, error: null };
}

// ============================================================================
// BOOKING MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Creates a new desk booking for a user
 *
 * BUSINESS RULES:
 * 1. User must be authenticated
 * 2. User profile must exist (created automatically if needed)
 * 3. One booking per user per day limit
 * 4. Desk must be available (checked at UI level)
 *
 * PROCESS:
 * 1. Ensure user profile exists
 * 2. Check for existing booking on the same date
 * 3. Create new booking if validation passes
 *
 * @param deskId - ID of the desk to book
 * @param date - Booking date in YYYY-MM-DD format
 * @param notes - Optional user notes
 * @returns Promise with created booking or error
 */
export async function createBooking(
  deskId: string,
  date: string,
  notes?: string
): Promise<{ booking: Booking | null; error: PostgrestError | null }> {
  // Step 1: Ensure user profile exists in our database
  const { success: profileSuccess, error: profileError } =
    await ensureUserProfile();

  if (!profileSuccess || profileError) {
    return { booking: null, error: profileError };
  }

  // Step 2: Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      booking: null,
      error: { message: "User not authenticated" } as PostgrestError,
    };
  }

  // Step 2.5: Check if user has a permanently assigned desk
  // Business rule: Users with assigned desks cannot make additional bookings
  const { data: assignedDesk, error: assignedError } = await supabase
    .from("desks")
    .select("name, assignment_note")
    .eq("assigned_to_user_id", user.id)
    .limit(1);

  if (assignedError) {
    return { booking: null, error: assignedError };
  }

  // Reject if user has a permanently assigned desk
  if (assignedDesk && assignedDesk.length > 0) {
    return {
      booking: null,
      error: {
        message: `You have a permanently assigned desk (${assignedDesk[0].name}) and cannot make additional bookings. Please contact your administrator if you need to change desks.`,
        code: "USER_HAS_ASSIGNED_DESK",
      } as PostgrestError,
    };
  }

  // Step 3: Check if user already has a booking for this date
  // Business rule: One booking per user per day
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

  // Reject if user already has a booking for this date
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

  // Step 3.5: Check if desk is permanently assigned to someone else
  // Business rule: Cannot book a desk assigned to another user
  const { data: deskInfo, error: deskError } = await supabase
    .from("desks")
    .select("assigned_to_user_id, name")
    .eq("id", deskId)
    .single();

  if (deskError) {
    return { booking: null, error: deskError };
  }

  // Reject if desk is assigned to someone else
  if (
    deskInfo.assigned_to_user_id &&
    deskInfo.assigned_to_user_id !== user.id
  ) {
    return {
      booking: null,
      error: {
        message: `This desk (${deskInfo.name}) is permanently assigned to another user and cannot be booked.`,
        code: "DESK_PERMANENTLY_ASSIGNED",
      } as PostgrestError,
    };
  }

  // Step 4: Create the new booking
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      desk_id: deskId,
      booking_date: date,
      notes: notes || null,
      // status defaults to "active"
    })
    .select("*")
    .single();

  return { booking, error };
}

/**
 * Cancels a booking by completely removing it from the database
 *
 * BUSINESS LOGIC:
 * - Hard delete (complete removal) instead of soft delete (status = cancelled)
 * - This keeps the database clean and improves performance
 * - Once cancelled, booking data is permanently lost
 *
 * @param bookingId - ID of the booking to cancel
 * @returns Promise with success status and any error
 */
export async function cancelBooking(
  bookingId: string
): Promise<{ success: boolean; error: PostgrestError | null }> {
  const { error } = await supabase
    .from("bookings")
    .delete() // Hard delete - completely removes the record
    .eq("id", bookingId);

  return { success: !error, error };
}

/**
 * Retrieves bookings for a specific user
 *
 * FEATURES:
 * - Fetches only active bookings (excludes cancelled ones)
 * - Includes related desk information (name, location)
 * - Orders by booking date (ascending) for chronological display
 * - Supports pagination with limit parameter
 * - Auto-detects current user if no userId provided
 *
 * @param userId - Optional user ID, defaults to current authenticated user
 * @param limit - Maximum number of bookings to return
 * @returns Promise with user's bookings and any error
 */
export async function getUserBookings(
  userId?: string,
  limit = 10
): Promise<{ bookings: Booking[]; error: PostgrestError | null }> {
  // Build the query with joins to get desk information
  let query = supabase
    .from("bookings")
    .select(
      `
      *,
      desks:desk_id (name, location)
    `
    )
    .eq("status", "active") // Only active bookings
    .order("booking_date", { ascending: true }) // Chronological order
    .limit(limit); // Pagination

  // Handle user ID logic
  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    // If no userId provided, fetch for current authenticated user
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

// ============================================================================
// DATA RETENTION & CLEANUP FUNCTIONS
// ============================================================================

/**
 * Removes old bookings from the database for data retention compliance
 *
 * BUSINESS LOGIC:
 * - Default retention period: 90 days
 * - Permanently deletes bookings older than the retention period
 * - Helps maintain database performance and comply with data protection laws
 * - Returns count of deleted records for monitoring
 *
 * USAGE:
 * - Can be called manually or automated via cron jobs
 * - Should be run periodically (e.g., daily or weekly)
 *
 * @param retentionDays - Number of days to retain data (default: 90)
 * @returns Promise with cleanup results
 */
export async function cleanupOldBookings(retentionDays = 90): Promise<{
  success: boolean;
  deletedCount: number;
  error: PostgrestError | null;
}> {
  // Calculate cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffDateString = cutoffDate.toISOString().split("T")[0];

  // Delete bookings older than cutoff date
  const { data, error } = await supabase
    .from("bookings")
    .delete()
    .lt("booking_date", cutoffDateString) // Less than cutoff date
    .select("id"); // Return deleted IDs for counting

  return {
    success: !error,
    deletedCount: data?.length || 0, // Count of deleted records
    error,
  };
}

/**
 * Enhanced version of getUserBookings with automatic cleanup
 *
 * FEATURES:
 * - Combines booking retrieval with automatic data cleanup
 * - Runs cleanup transparently in the background
 * - Returns cleanup results for monitoring/logging
 * - Provides seamless data retention management
 *
 * BUSINESS VALUE:
 * - Ensures database stays clean without manual intervention
 * - Maintains performance by preventing data accumulation
 * - Provides audit trail of cleanup operations
 *
 * @param userId - Optional user ID
 * @param limit - Maximum bookings to return
 * @param autoCleanup - Whether to run automatic cleanup (default: true)
 * @returns Promise with bookings and cleanup results
 */
export async function getUserBookingsWithCleanup(
  userId?: string,
  limit = 10,
  autoCleanup = true
): Promise<{
  bookings: Booking[];
  cleanupResult?: { deletedCount: number };
  error: PostgrestError | null;
}> {
  // Step 1: Automatic cleanup of old bookings (90 days retention)
  let cleanupResult;
  if (autoCleanup) {
    const cleanup = await cleanupOldBookings(90);
    if (cleanup.success && cleanup.deletedCount > 0) {
      cleanupResult = { deletedCount: cleanup.deletedCount };
    }
  }

  // Step 2: Fetch user bookings
  const { bookings, error } = await getUserBookings(userId, limit);

  return {
    bookings,
    cleanupResult, // Include cleanup results for monitoring
    error,
  };
}

// ============================================================================
// ANALYTICS & REPORTING FUNCTIONS
// ============================================================================

/**
 * Calcule les dates de la semaine en cours (lundi à vendredi)
 * Peu importe le jour actuel, retourne toujours la semaine complète
 *
 * @returns Object avec les dates de lundi à vendredi au format YYYY-MM-DD
 */
export function getCurrentWeekDates(): {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  dates: string[];
} {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi

  // Calculer le lundi de la semaine en cours
  const monday = new Date(today);
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Si dimanche (0), alors -6 jours
  monday.setDate(today.getDate() - daysFromMonday);

  // Calculer les autres jours de la semaine
  const tuesday = new Date(monday);
  tuesday.setDate(monday.getDate() + 1);

  const wednesday = new Date(monday);
  wednesday.setDate(monday.getDate() + 2);

  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  // Convertir en format YYYY-MM-DD
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const dates = [
    formatDate(monday),
    formatDate(tuesday),
    formatDate(wednesday),
    formatDate(thursday),
    formatDate(friday),
  ];

  return {
    monday: dates[0],
    tuesday: dates[1],
    wednesday: dates[2],
    thursday: dates[3],
    friday: dates[4],
    dates,
  };
}

/**
 * Récupère toutes les réservations pour la semaine en cours
 * Inclut les informations des utilisateurs et des desks
 *
 * @returns Promise avec les réservations groupées par date
 */
export async function getCurrentWeekBookings(): Promise<{
  bookingsByDate: Record<string, Booking[]>;
  allUsers: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
  error: PostgrestError | null;
}> {
  const weekDates = getCurrentWeekDates();

  // Récupérer toutes les réservations de la semaine
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      users:user_id (
        id,
        first_name,
        last_name,
        email
      ),
      desks:desk_id (
        name,
        location
      )
    `
    )
    .in("booking_date", weekDates.dates)
    .eq("status", "active")
    .order("booking_date");

  if (error) {
    return { bookingsByDate: {}, allUsers: [], error };
  }

  // Grouper les réservations par date
  const bookingsByDate: Record<string, Booking[]> = {};
  weekDates.dates.forEach((date) => {
    bookingsByDate[date] = [];
  });

  bookings?.forEach((booking) => {
    if (booking.booking_date && bookingsByDate[booking.booking_date]) {
      bookingsByDate[booking.booking_date].push(booking);
    }
  });

  // Récupérer tous les utilisateurs qui ont des réservations cette semaine
  const uniqueUsers = new Map();
  bookings?.forEach((booking) => {
    if (booking.users && booking.users.id) {
      uniqueUsers.set(booking.users.id, booking.users);
    }
  });

  const allUsers = Array.from(uniqueUsers.values()).sort((a, b) =>
    `${a.first_name} ${a.last_name}`.localeCompare(
      `${b.first_name} ${b.last_name}`
    )
  );

  return { bookingsByDate, allUsers, error: null };
}

/**
 * Generates usage statistics for the booking system
 *
 * ANALYTICS PROVIDED:
 * - Total bookings in date range
 * - Number of unique users
 * - Most popular desk (highest booking count)
 * - Average bookings per day
 *
 * BUSINESS VALUE:
 * - Helps optimize desk allocation
 * - Identifies usage patterns and trends
 * - Supports capacity planning decisions
 * - Enables data-driven workplace management
 *
 * @param startDate - Optional start date filter (YYYY-MM-DD)
 * @param endDate - Optional end date filter (YYYY-MM-DD)
 * @returns Promise with usage statistics
 */
export async function getUsageStats(
  startDate?: string,
  endDate?: string
): Promise<{
  stats: {
    totalBookings: number;
    uniqueUsers: number;
    mostPopularDesk: { name: string; count: number } | null;
    averageBookingsPerDay: number;
  } | null;
  error: PostgrestError | null;
}> {
  // Build query with optional date filters
  let query = supabase
    .from("bookings")
    .select(
      `
      id,
      user_id,
      booking_date,
      desks:desk_id (name)
    `
    )
    .eq("status", "active"); // Only count active bookings

  // Apply date filters if provided
  if (startDate) query = query.gte("booking_date", startDate);
  if (endDate) query = query.lte("booking_date", endDate);

  const { data: bookings, error } = await query;

  if (error || !bookings) {
    return { stats: null, error };
  }

  // Calculate statistics

  // 1. Count unique users
  const uniqueUsers = new Set(bookings.map((b) => b.user_id)).size;

  // 2. Count bookings per desk to find most popular
  const deskCounts = bookings.reduce((acc, booking) => {
    // Handle case where desks might be array or object (Supabase join quirk)
    const desk = Array.isArray(booking.desks)
      ? booking.desks[0]
      : booking.desks;
    const deskName = desk?.name || "Unknown";
    acc[deskName] = (acc[deskName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 3. Find most popular desk
  const mostPopularDesk =
    Object.entries(deskCounts).length > 0
      ? Object.entries(deskCounts).reduce(
          (max, [name, count]) => (count > max.count ? { name, count } : max),
          { name: "", count: 0 }
        )
      : null;

  // 4. Calculate average bookings per day
  const dateRange =
    startDate && endDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 30; // Default to 30 days if no date range provided

  const averageBookingsPerDay = bookings.length / dateRange;

  return {
    stats: {
      totalBookings: bookings.length,
      uniqueUsers,
      mostPopularDesk,
      averageBookingsPerDay: Math.round(averageBookingsPerDay * 100) / 100, // Round to 2 decimals
    },
    error: null,
  };
}
