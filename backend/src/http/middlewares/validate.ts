import prisma from "@/db/_db";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Middleware generator to validate that all required fields are present in the request body.
 *
 * @param {string[]} requiredFields - An array of strings representing the required fields in the request body.
 * @returns A middleware function that checks if the required fields are present in `req.body`.
 *          If any field is missing, it responds with a 400 status and a list of missing fields.
 *          Only calls `next()` if all fields are present on the body.
 */
export const validateRequiredFields = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];

    requiredFields.forEach((field) => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
      return;
    }

    next();
  };
};

export async function extractUserFromTokenMiddleWare(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    const { userId, expired } = extractUserIdFromToken(token);
    if (!userId || expired) {
      throw Error;
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }
}

export function extractUserIdFromToken(token: string): TokenExtractResult {
  try {
    const decoded = jwt.verify(token, "your_secret_key");

    if (!decoded || typeof decoded !== "object" || !decoded.userId) {
      return { userId: null, expired: false };
    }

    const expired = decoded.exp ? Date.now() >= decoded.exp * 1000 : false;

    return { userId: decoded.userId as string, expired };
  } catch (error) {
    return { userId: null, expired: false };
  }
}

interface TokenExtractResult {
  userId: string | null;
  expired: boolean;
}
