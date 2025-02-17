import { NextFunction, Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findUserByName } from "./db/user";

const authRouter = Router();
authRouter.post("/login", loginUser);
authRouter.post("/register", registerUser);
export default authRouter;

async function registerUser(req: Request, res: Response, next: NextFunction) {
  const { username, password } = req.body;

  try {
    const existingUser = await findUserByName(username);

    if (existingUser) {
      res.status(400).json({ message: "User with username already exists" });
      return;
    }

    const newUser = await createUser(username, password);

    const token = generateToken(newUser.id);
    res.status(201).json({ message: "User registered successfully", token });
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
    console.error("Error during login: \n", error);
  }
}

async function loginUser(req: Request, res: Response, next: NextFunction) {
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
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
    console.error("Error during login: \n", error);
  }
}

// Helper function to generate JWT
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, "your_secret_key", { expiresIn: "1h" });
};
