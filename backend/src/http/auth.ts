import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  createUser,
  deleteUser,
  findUserByName,
  updateUser,
  updateUserMfa,
} from "@/db/user";
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
  nextSetupMfaResponse,
  nextVerifyMfaResponse,
  missingFieldsResponse,
} from "@common";
import { User } from "@prisma/client";
import { generateTotpUri, verifyToken } from "authenticator";
import { decryptData } from "@/encryption";
import { arrayToString } from "@common";

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
authRouter.post("/enablemfa", extractUserFromTokenMiddleWare, enableMfa);
authRouter.post(
  "/disablemfa",
  validateRequiredFields(["mfa"]),
  extractUserFromTokenMiddleWare,
  disableMfa
);

authRouter.put(
  "/",
  validateRequiredFields(["oldPassword", "newPassword"]),
  extractUserFromTokenMiddleWare,
  changePassword
);
authRouter.delete("/", extractUserFromTokenMiddleWare, deleteProfile);
export default authRouter;

/**
 * Register Request handler
 *
 * Creates a new user with the username password combination if a user with that username does not exist
 *
 * Creates a 2FA key, if the `mfaEnabled` field in the body is `true`
 *
 * Sends an {@link AuthResponse}. {@link AuthSuccessResponse} on success, {@link AuthErrorResponse} on error.
 *
 * {@link validateRequiredFields} middleware runs before this handler, no validation needed
 */
async function registerUser(req: Request, res: Response) {
  const { username, password, mfaEnabled } = req.body;

  try {
    const existingUser = await findUserByName(username);

    if (existingUser) {
      res.status(400).json(userExistsResponse);
      return;
    }

    const newUser = await createUser(username, password, mfaEnabled);
    if (!newUser) {
      throw new Error("Error creating user in database");
    }

    if (mfaEnabled) {
      const authKey = decryptData({
        encrypted: newUser.authKey!,
        iv: newUser.iv!,
        authTag: newUser.authTag!,
      });

      const setupCode = generateTotpUri(
        arrayToString(authKey),
        newUser.username,
        "Veil",
        "SHA1",
        6,
        30
      );

      res.status(201).json(nextSetupMfaResponse(setupCode));
      return;
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
 * Searches a user with the given username password combination,
 * checks for 2FA code if the account has 2FA enabled
 *
 * Sends an {@link AuthResponse}. {@link AuthSuccessResponse} on success, {@link AuthErrorResponse} on error.
 *
 * {@link validateRequiredFields} middleware runs before this handler, no validation needed
 */
async function loginUser(req: Request, res: Response) {
  const { username, password, mfa } = req.body;

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

    if (user.authKey) {
      if (!mfa) {
        res.json(nextVerifyMfaResponse);
        return;
      }
      const decrypted2FA = decryptData({
        encrypted: user.authKey!,
        iv: user.iv!,
        authTag: user.authTag!,
      });
      const verifyResult = verifyToken(arrayToString(decrypted2FA), mfa);
      if (!verifyResult) {
        res.status(400).json(invalidCredentialsResponse);
        return;
      }
    }

    const token = generateToken(user.id);
    res.json(successResponse(token, user));
  } catch (error) {
    res.status(500).json(serverErrorResponse);
    console.error("Error during login: \n", error);
  }
}

async function changePassword(req: Request, res: Response) {
  try {
    const user = req.user as User;
    const { oldPassword, newPassword } = req.body;

    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
      res.status(400).json(invalidCredentialsResponse);
      return;
    }

    const updatedUser = await updateUser({
      id: user.id,
      password: newPassword,
    });
    if (!updatedUser) {
      throw new Error("Error updating user");
    }

    const token = generateToken(user.id);
    res.json(successResponse(token, updatedUser));
  } catch (error) {
    res.status(500).json(serverErrorResponse);
    console.error("Error during password change: \n", error);
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
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "1h" });
};

async function enableMfa(req: Request, res: Response) {
  try {
    const user = req.user as User;

    const updatedUser = await updateUserMfa(user.id, "enable");
    if (!updatedUser) throw new Error("Error updating user");

    const authKey = decryptData({
      encrypted: updatedUser.authKey!,
      iv: updatedUser.iv!,
      authTag: updatedUser.authTag!,
    });

    const setupCode = generateTotpUri(
      arrayToString(authKey),
      user.username,
      "Veil",
      "SHA1",
      6,
      30
    );

    res.status(201).json(nextSetupMfaResponse(setupCode));
  } catch (error) {
    res.status(500).json(serverErrorResponse);
    console.error("Error during mfa enable: \n", error);
  }
}

async function disableMfa(req: Request, res: Response) {
  try {
    const { mfa } = req.body;
    const user = req.user as User;

    const decrypted2FA = decryptData({
      encrypted: user.authKey!,
      iv: user.iv!,
      authTag: user.authTag!,
    });
    const verifyResult = verifyToken(arrayToString(decrypted2FA), mfa);
    if (!verifyResult) {
      res.status(400).json(invalidCredentialsResponse);
      return;
    }

    const updatedUser = await updateUserMfa(user.id, "disable");
    if (!updatedUser) throw new Error("Error updating user");

    const token = generateToken(user.id);
    res.json(successResponse(token, updatedUser));
  } catch (error) {
    res.status(500).json(serverErrorResponse);
    console.error("Error during mfa disable: \n", error);
  }
}

async function deleteProfile(req: Request, res: Response) {
  try {
    const { mfa } = req.body;
    const user = req.user as User;

    if (!user.authKey) {
      const deleted = await deleteUser(user.id);
      if (!deleted) throw new Error("Error deleting user");
      res.json({});
      return;
    }

    if (!mfa) {
      res.json(missingFieldsResponse(["mfa"]));
      return;
    }

    const decrypted2FA = decryptData({
      encrypted: user.authKey!,
      iv: user.iv!,
      authTag: user.authTag!,
    });
    const verifyResult = verifyToken(arrayToString(decrypted2FA), mfa);
    if (!verifyResult) {
      res.status(400).json(invalidCredentialsResponse);
      return;
    }

    const deleted = await deleteUser(user.id);
    if (!deleted) throw new Error("Error deleting user");
    res.json({});
  } catch (error) {
    res.status(500).json(serverErrorResponse);
    console.error("Error during account deletion: \n", error);
  }
}
