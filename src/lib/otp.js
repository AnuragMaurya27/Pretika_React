import { post } from "./api";

// Message Central SMS OTP — signup + forgot-password.
// Request bodies use snake_case to match the API (like /auth/login's email_or_username).
export const sendOtp = (phone, purpose = "signup", country_code = "91") =>
  post("/auth/otp/send", { phone, purpose, country_code });

export const verifyOtp = (verification_id, code) =>
  post("/auth/otp/verify", { verification_id, code });

export const resetPasswordOtp = (verification_id, code, new_password) =>
  post("/auth/reset-password-otp", { verification_id, code, new_password });
