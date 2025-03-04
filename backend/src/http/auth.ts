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
  missingFieldsResponse,
  noTokenProvidedResponse,
  successResponse,
  userExistsResponse,
} from "@common";

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
    res.status(201).json(successResponse(token));
  } catch (error) {
    console.error("Error during register: \n", error);
    res.status(500).json(serverErrorResponse);
  }
}

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
    res.json(successResponse(token));
  } catch (error) {
    res.status(500).json(serverErrorResponse);
    console.error("Error during login: \n", error);
  }
}

async function refreshToken(req: Request, res: Response) {
  const userId = req.user?.id as string;
  const newToken = generateToken(userId);
  res.json(successResponse(newToken));
}

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, "your_secret_key", { expiresIn: "1h" });
};
