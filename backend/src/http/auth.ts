import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findUserByName } from "@/db/user";
import {
  extractUserFromTokenMiddleWare,
  validateRequiredFields,
} from "@/http/middlewares/validate";

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
      res.status(400).json({ message: "User with username already exists" });
      return;
    }

    const newUser = await createUser(username, password);
    if (!newUser) {
      throw new Error("Error creating user in database");
    }

    const token = generateToken(newUser.id);
    res.status(201).json({ message: "Success", token });
  } catch (error) {
    console.error("Error during register: \n", error);
    res.status(500).json({ message: "Server error" });
  }
}

async function loginUser(req: Request, res: Response) {
  const { username, password } = req.body;

  try {
    const user = await findUserByName(username);

    //Invalid username
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    //Invalid password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const token = generateToken(user.id);
    res.json({ message: "Success", token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
    console.error("Error during login: \n", error);
  }
}

async function refreshToken(req: Request, res: Response) {
  const userId = req.user?.id as string;
  const newToken = generateToken(userId);
  res.json({ token: newToken });
}

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, "your_secret_key", { expiresIn: "1h" });
};
