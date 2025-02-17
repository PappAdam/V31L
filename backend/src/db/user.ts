import bcrypt from "bcryptjs";
import { prisma } from "../index.ts";
import { User } from "@prisma/client";

/**
 * Creates and stores a new user in the database with a hashed password.
 *
 * This function hashes the provided password using bcrypt before saving
 * the user's details to the database.
 *
 * @param username The username of the new user. Must be unique.
 * @param password The plaintext password to be hashed and stored.
 *
 * @returns The newly created user object, including the username and hashed password.
 *
 * @throws {Error} If there is an issue with database creation or password hashing.
 */
export async function createUser(username: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  });

  return newUser;
}

/**
 * Finds and retrieves a user from the database by their username.
 *
 * @param username The username of the user to retrieve.
 *
 * @returns The user object if found, or `null` if no user with the given username exists.
 */
export async function findUserByName(username: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: {
      username, // searching by the unique username field
    },
  });

  return user;
}
