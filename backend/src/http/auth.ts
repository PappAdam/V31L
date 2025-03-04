import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findUserByName } from "@/db/user";
import {
  extractUserFromTokenMiddleWare,
  validateRequiredFields,
} from "@/http/middlewares/validate";
import {
  invalidCredentialsResponse,
  serverErrorResponse,
  successResponse,
  userExistsResponse,
  AuthResponse,
  AuthErrorResponse,
  AuthSuccessResponse,
} from "@common";
import { User } from "@prisma/client";

const authRouter = Router();
authRouter.post(
  "/register",
  validateRequiredFields(["username", "password"]),
  registerUser
);
authRouter.post(
  "/login",
  validateRequiredFields(["username", "password"]),
  loginUser
);
authRouter.post("/refresh", extractUserFromTokenMiddleWare, refreshToken);
export default authRouter;

/**
 * Register Request handler
 *
 * Creates a new user with the username password combination if a user with that username does not exist
 *
 * Sends an {@link AuthResponse}. {@link AuthSuccessResponse} on success, {@link AuthErrorResponse} on error.
 *
 * {@link validateRequiredFields} middleware runs before this handler, no validation needed
 */
async function registerUser(req: Request, res: Response) {
  const { username, password } = req.body;

  try {
    const existingUser = await findUserByName(username);

    if (existingUser) {
      res.status(400).json(userExistsResponse);
      return;
    }

    const newUser = await createUser(username, password);
    if (!newUser) {
      throw new Error("Error creating user in database");
    }

    const token = generateToken(newUser.id);
    res.status(201).json(successResponse(token, newUser));
  } catch (error) {
    console.error("Error during register: \n", error);
    res.status(500).json(serverErrorResponse);
  }
}

/**
 * Login Request handler
 *
 * Searches a user with the givem username password combination
 *
 * Sends an {@link AuthResponse}. {@link AuthSuccessResponse} on success, {@link AuthErrorResponse} on error.
 *
 * {@link validateRequiredFields} middleware runs before this handler, no validation needed
 */
async function loginUser(req: Request, res: Response) {
  const { username, password } = req.body;

  try {
    const user = await findUserByName(username);

    //Invalid username
    if (!user) {
      res.status(400).json(invalidCredentialsResponse);
      return;
    }

    //Invalid password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      res.status(400).json(invalidCredentialsResponse);
      return;
    }

    const token = generateToken(user.id);
    res.json(successResponse(token, user));
  } catch (error) {
    res.status(500).json(serverErrorResponse);
    console.error("Error during login: \n", error);
  }
}

/**
 * Refresh request handler
 *
 * Generates a new JWT token, then sends it in response
 *
 * {@link extractUserFromTokenMiddleWare} middleware runs before this handler, no validation needed
 */
async function refreshToken(req: Request, res: Response) {
  const user = req.user as User;
  const newToken = generateToken(user.id);
  res.json(successResponse(newToken, user));
}

/**
 * Generates a new JWT token
 * @param userId The userId to generate the JWT token with
 * @returns The generated JWT token
 */
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, "your_secret_key", { expiresIn: "1h" });
};
