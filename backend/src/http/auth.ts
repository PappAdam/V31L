import { NextFunction, Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findUserByName } from "../db/user";
import { prisma } from "..";

const authRouter = Router();
authRouter.post("/login", loginUser);
authRouter.post("/register", registerUser);
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

    // Generate JWT token
    const token = generateToken(user.id);
    res.json({ message: "Success", token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
    console.error("Error during login: \n", error);
  }
}

// Helper function to generate JWT
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, "your_secret_key", { expiresIn: "1h" });
};

export async function extractUserFromTokenMiddleWare(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Get the token from the Authorization header
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ message: "No token provided." });
    return;
  }

  try {
    const userId = extractUserIdFromToken(token);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
    return;
  }
}

export function extractUserIdFromToken(token: string): string {
  const decoded = jwt.verify(token, "your_secret_key");
  if (typeof decoded !== "object") {
    throw Error;
  }

  return decoded.userId as string;
}
