import bcrypt from "bcryptjs";
import { User } from "@prisma/client";
import prisma from "./_db";
import authenticator from "authenticator";
import { encryptData } from "@/encryption";

/**
 * Creates a new user.
 *
 * @param {string} username - The username of the user to be created.
 * @param {string} password - The password of the user to be created. This will be hashed.
 * @returns {Promise<User | null>} `User` if successful, `null` if there was an error.
 */
export async function createUser(
  username: string,
  password: string,
  mfaEnabled: boolean,
  profilePictureId?: string
): Promise<User | null> {
  if (!username || !password) {
    return null;
  }
  try {
    password = await bcrypt.hash(password, 10);
    const authKey = encryptData(authenticator.generateKey());

    const newUser = await prisma.user.create({
      data: {
        username,
        password,
        profilePictureId: profilePictureId || "pfpImg",
        ...(mfaEnabled
          ? {
              authKey: authKey.encrypted,
              iv: authKey.iv,
              authTag: authKey.authTag,
            }
          : null),
      },
    });

    return newUser;
  } catch (error) {
    console.error("Error creating user:\n", error);
    return null;
  }
}

/**
 * Gets a user with the given username.
 *
 * @param username The username of the user to get.
 *
 * @returns `User` if found, `null` if no user with the given username exists.
 */
export async function findUserByName(username: string): Promise<User | null> {
  if (!username) {
    return null;
  }
  try {
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });
    return user;
  } catch (error) {
    console.error("Error finding user:\n", error);
    return null;
  }
}

/**
 * Gets a user with the given id.
 *
 * @param userId The id of the user to get.
 *
 * @returns `User` if found, `null` if no user with the given id exists.
 */
export async function findUserById(userId: string): Promise<User | null> {
  if (!userId) {
    return null;
  }
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    return user;
  } catch (error) {
    console.error("Error finding user:\n", error);
    return null;
  }
}

export async function updateUser(
  user: Partial<User> & { id: string }
): Promise<User | null> {
  try {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: user,
    });

    return updatedUser;
  } catch (error) {
    console.error("Error updating user:\n", error);
    return null;
  }
}

export async function updateUserMfa(
  userId: string,
  // Update could be a feature here later?
  mode: "enable" | "disable"
): Promise<User | null> {
  switch (mode) {
    case "enable":
      const authKey = encryptData(authenticator.generateKey());
      return await updateUser({
        id: userId,
        authKey: authKey.encrypted,
        iv: authKey.iv,
        authTag: authKey.authTag,
      });
    case "disable":
      return await updateUser({
        id: userId,
        authKey: null,
        authTag: null,
      });
  }
}
