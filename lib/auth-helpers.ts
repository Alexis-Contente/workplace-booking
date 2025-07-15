import { supabase } from "./supabase";

// Password validation according to our criteria
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Minimum 14 characters
  if (password.length < 14) {
    errors.push("Password must be at least 14 characters long");
  }

  // At least 2 numbers
  const digitCount = (password.match(/\d/g) || []).length;
  if (digitCount < 2) {
    errors.push("Password must contain at least 2 numbers");
  }

  // At least 1 special character
  const specialChars = /[!@#$%^&*(),.?":{}|<>]/;
  if (!specialChars.test(password)) {
    errors.push(
      'Password must contain at least 1 special character (!@#$%^&*(),.?":{}|<>)'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validation email professional
export function validateCompanyEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@quant-cube.com");
}

// Sign up function with validation
export async function signUpWithCompanyEmail(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  // Validation email company
  if (!validateCompanyEmail(email)) {
    return {
      data: null,
      error: { message: "Please use your @quant-cube.com email address" },
    };
  }

  // Validation password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return {
      data: null,
      error: { message: passwordValidation.errors.join(". ") },
    };
  }

  // Supabase sign up with metadata
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      },
    },
  });

  // The user profile is now created automatically by the database trigger
  if (data.user && !error) {
    console.log("User signed up successfully:", data.user.id);
    console.log(
      "User profile will be created automatically by database trigger"
    );
  }

  return { data, error };
}

// Sign in function (corrected version)
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

// Sign out function
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Get current user
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}
