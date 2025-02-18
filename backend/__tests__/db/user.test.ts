import { prisma } from "../../src/index";
import bcrypt from "bcryptjs";
import { createUser, findUserByName } from "../../src/db/user";

jest.mock("../../src/index", () => {
  return {
    prisma: {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    },
  };
});

// Mock bcrypt.hash function
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

describe("createUser", () => {
  let mockCreateUser: jest.Mock;
  let mockHash: jest.Mock;

  beforeEach(() => {
    mockCreateUser = prisma.user.create as jest.Mock;
    mockHash = bcrypt.hash as jest.Mock;
  });

  it("should create a user successfully", async () => {
    mockHash.mockResolvedValue("hashedPassword");
    mockCreateUser.mockResolvedValue({
      id: "uuid",
      username: "testuser",
      password: "hashedPassword",
    });

    // Act: Call createUser function
    const result = await createUser("testuser", "password123");

    // Assert: Check if the user was created successfully
    expect(result).toEqual({
      id: "uuid",
      username: "testuser",
      password: "hashedPassword",
    });
    expect(mockHash).toHaveBeenCalledWith("password123", 10);
    expect(mockCreateUser).toHaveBeenCalledWith({
      data: {
        username: "testuser",
        password: "hashedPassword",
      },
    });
  });

  it("should return null if an error occurs", async () => {
    // Arrange: Mock bcrypt.hash to resolve and Prisma to throw an error
    mockHash.mockResolvedValue("hashedPassword");
    mockCreateUser.mockRejectedValue(new Error("Database error"));

    // Act: Call createUser function
    const result = await createUser("testuser", "password123");

    // Assert: Check if null is returned when there's an error
    expect(result).toBeNull();
    expect(mockHash).toHaveBeenCalledWith("password123", 10);
    expect(mockCreateUser).toHaveBeenCalledWith({
      data: {
        username: "testuser",
        password: "hashedPassword",
      },
    });
  });
});

describe("findUserByName", () => {
  let mockFindUserByName: jest.Mock;

  beforeEach(() => {
    mockFindUserByName = prisma.user.findUnique as jest.Mock;
    jest.clearAllMocks();
  });

  it("should return a user when a valid username is provided", async () => {
    // Arrange: Mock the return value of findUnique
    const mockUser = {
      id: "uuid",
      username: "testuser",
      password: "hashedPassword",
    };
    mockFindUserByName.mockResolvedValue(mockUser);

    // Act: Call the function with a valid username
    const result = await findUserByName("testuser");

    // Assert: The result should match the mock user
    expect(result).toEqual(mockUser);
    expect(mockFindUserByName).toHaveBeenCalledWith({
      where: { username: "testuser" },
    });
  });

  it("should return null when an empty username is provided", async () => {
    // Act: Call the function with an empty username
    const result = await findUserByName("");

    // Assert: The result should be null
    expect(result).toBeNull();
    expect(mockFindUserByName).not.toHaveBeenCalled(); // Ensure the database was not queried
  });

  it("should return null when no user is found", async () => {
    // Arrange: Mock findUnique to return null (no user found)
    mockFindUserByName.mockResolvedValue(null);

    // Act: Call the function with a username that does not exist
    const result = await findUserByName("nonexistentuser");

    // Assert: The result should be null
    expect(result).toBeNull();
    expect(mockFindUserByName).toHaveBeenCalledWith({
      where: { username: "nonexistentuser" },
    });
  });

  it("should return null when there is a database error", async () => {
    // Arrange: Mock findUnique to throw an error
    mockFindUserByName.mockRejectedValue(new Error("Database error"));

    // Act: Call the function with a valid username
    const result = await findUserByName("testuser");

    // Assert: The result should be null when an error occurs
    expect(result).toBeNull();
    expect(mockFindUserByName).toHaveBeenCalledWith({
      where: { username: "testuser" },
    });
  });
});
