import { PublicUser } from "../socket/public";

export type AuthResponse =
  | AuthSuccessResponse
  | AuthNextResponse
  | AuthErrorResponse;

export type AuthNextResponse =
  | AuthNextMfaSetupResponse
  | AuthNextMfaVerifyReponse;

export type AuthSuccessResponse = {
  result: "Success";
  token: string;
} & PublicUser;

export type AuthNextMfaSetupResponse = {
  result: "Next";
  to: "Setup";
  setupCode: string;
};

export type AuthNextMfaVerifyReponse = {
  result: "Next";
  to: "Verify";
};

export type AuthErrorResponse = {
  result: "Error";
  message:
    | "No token provided"
    | "Invalid credentials"
    | "User with username already exists"
    | "Server error"
    | `Missing required fields: ${string}`
    | "Invalid or expired token";
};

// Used in both auth requests
export const successResponse = (
  token: string,
  user: PublicUser
): AuthSuccessResponse => {
  return {
    result: "Success",
    token,
    id: user.id,
    username: user.username,
  };
};

export const nextSetupMfaResponse = (
  setupCode: string
): AuthNextMfaSetupResponse => {
  return {
    result: "Next",
    to: "Setup",
    setupCode,
  };
};

export const nextVerifyMfaResponse: AuthNextMfaVerifyReponse = {
  result: "Next",
  to: "Verify",
};

export const serverErrorResponse: AuthErrorResponse = {
  result: "Error",
  message: "Server error",
};

// Used in Login
export const invalidCredentialsResponse: AuthErrorResponse = {
  result: "Error",
  message: "Invalid credentials",
};

// Used in Register
export const userExistsResponse: AuthErrorResponse = {
  result: "Error",
  message: "User with username already exists",
};

// Middleware errors
export const missingFieldsResponse = (fields: string[]): AuthErrorResponse => {
  return {
    result: "Error",
    message: `Missing required fields: ${fields.join(", ")}`,
  };
};

export const invalidTokenResponse: AuthErrorResponse = {
  result: "Error",
  message: "Invalid or expired token",
};

export const noTokenProvidedResponse: AuthErrorResponse = {
  result: "Error",
  message: "No token provided",
};
