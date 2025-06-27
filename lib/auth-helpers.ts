import { supabase } from "./supabase";

// Validation du mot de passe selon tes critères
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Minimum 14 caractères
  if (password.length < 14) {
    errors.push("Password must be at least 14 characters long");
  }

  // Au moins 2 chiffres
  const digitCount = (password.match(/\d/g) || []).length;
  if (digitCount < 2) {
    errors.push("Password must contain at least 2 numbers");
  }

  // Au moins 1 caractère spécial
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

// Validation email professionnel
export function validateCompanyEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@quant-cube.com");
}

// Fonction d'inscription avec validation
export async function signUpWithCompanyEmail(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  // Validation email entreprise
  if (!validateCompanyEmail(email)) {
    return {
      data: null,
      error: { message: "Please use your @quant-cube.com email address" },
    };
  }

  // Validation mot de passe
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return {
      data: null,
      error: { message: passwordValidation.errors.join(". ") },
    };
  }

  // Inscription Supabase avec métadonnées
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

  // Si inscription réussie, créer l'entrée dans la table users
  if (data.user && !error) {
    const { error: insertError } = await supabase.from("users").insert({
      id: data.user.id,
      email: email,
      name: `${firstName} ${lastName}`,
    });

    if (insertError) {
      console.error("Error creating user profile:", insertError);
    }
  }

  return { data, error };
}

// Fonction de connexion (version corrigée)
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

// Fonction de déconnexion
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Obtenir l'utilisateur actuel
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}
