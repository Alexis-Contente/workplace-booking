"use client";

import { useState } from "react";
import Header from "../../components/header";
import Footer from "../../components/footer";
import {
  signUpWithCompanyEmail,
  signInWithEmail,
  validatePassword,
  validateCompanyEmail,
} from "../../lib/auth-helpers";

export default function LoginPage() {
  // States
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  // FUNCTIONS
  // Functions to handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // Function to check password criteria in real time
  const getPasswordCriteria = (password: string) => {
    return {
      length: password.length >= 14, // Check if password is at least 14 characters long
      numbers: (password.match(/\d/g) || []).length >= 2, // Check if password has at least 2 numbers
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password), // Check if password has at least 1 special character
    };
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrors([]);

    try {
      if (isLogin) {
        // Login mode
        const { error } = await signInWithEmail(
          formData.email,
          formData.password
        );

        if (error) {
          setErrors([error.message]);
        } else {
          setMessage("✅ Login successful! Redirecting...");
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        }
      } else {
        // Signup mode
        const validationErrors: string[] = [];

        // Email validation
        if (!validateCompanyEmail(formData.email)) {
          validationErrors.push(
            "Please use your @quant-cube.com email address"
          );
        }

        // Password validation
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
          validationErrors.push(...passwordValidation.errors);
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
          validationErrors.push("Passwords do not match");
        }

        // Required fields validation
        if (!formData.firstName.trim()) {
          validationErrors.push("First name is required");
        }
        if (!formData.lastName.trim()) {
          validationErrors.push("Last name is required");
        }

        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          setLoading(false);
          return;
        }

        // Signup
        const { error } = await signUpWithCompanyEmail(
          formData.email,
          formData.password,
          formData.firstName.trim(),
          formData.lastName.trim()
        );

        if (error) {
          setErrors([error.message]);
        } else {
          setMessage(
            "✅ Account created! Please check your email to confirm your account."
          );
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setErrors(["An unexpected error occurred. Please try again."]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-lg rounded-lg p-8">
            {/* Form header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {isLogin ? "Login" : "Sign Up"}
              </h1>
              <p className="text-gray-600">
                {isLogin
                  ? "Sign in to your account"
                  : "Create your QuantCube account"}
              </p>
            </div>

            {/* Toggle buttons */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setErrors([]);
                  setMessage("");
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  isLogin
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setErrors([]);
                  setMessage("");
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  !isLogin
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Messages */}
            {message && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{message}</p>
              </div>
            )}

            {errors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-800 mb-1">
                    • {error}
                  </p>
                ))}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        required={!isLogin}
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        required={!isLogin}
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john.doe@quant-cube.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••••••••"
                />
                {!isLogin && (
                  <div className="mt-2 space-y-1">
                    {(() => {
                      const criteria = getPasswordCriteria(formData.password);
                      return (
                        <div className="text-xs space-y-1">
                          <div
                            className={`flex items-center gap-2 ${
                              criteria.length
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            <span>{criteria.length ? "✅" : "❌"}</span>
                            <span>At least 14 characters</span>
                          </div>
                          <div
                            className={`flex items-center gap-2 ${
                              criteria.numbers
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            <span>{criteria.numbers ? "✅" : "❌"}</span>
                            <span>At least 2 numbers</span>
                          </div>
                          <div
                            className={`flex items-center gap-2 ${
                              criteria.special
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            <span>{criteria.special ? "✅" : "❌"}</span>
                            <span>
                              At least 1 special character (!@#$%^&*...)
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required={!isLogin}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••••••••"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full font-medium py-3 px-4 rounded-md transition-colors duration-200 mt-6 ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white`}
              >
                {loading
                  ? isLogin
                    ? "Signing in..."
                    : "Creating account..."
                  : isLogin
                  ? "Sign In"
                  : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
