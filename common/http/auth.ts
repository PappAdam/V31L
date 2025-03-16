import { PublicUser } from "../socket/public";

export type AuthSuccessResponse = {
  result: "Success";
  token: string;
} & PublicUser;

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

export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

// All auth requests
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

export const serverErrorResponse: AuthErrorResponse = {
  result: "Error",
  message: "Server error",
};

// Login
export const invalidCredentialsResponse: AuthErrorResponse = {
  result: "Error",
  message: "Invalid credentials",
};

// Register
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
