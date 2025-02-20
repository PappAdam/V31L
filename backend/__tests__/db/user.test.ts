import { prisma } from "../../src/index";
import bcrypt from "bcryptjs";
import { createUser, findUserByName } from "../../src/db/user";
import { User } from "@prisma/client";

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
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

const mockUser: User = {
  id: "id-123",
  username: "name-123",
  password: "pass-123",
};

describe("createUser(username: string, password: string): Promise<User | null>", () => {
  let mockCreateUser: jest.Mock;
  let mockHash: jest.Mock;

  beforeEach(() => {
    mockCreateUser = prisma.user.create as jest.Mock;
    mockHash = bcrypt.hash as jest.Mock;
    mockHash.mockResolvedValue("hashedPassword");
  });

  it("should create a User successfully", createSuccessful);
  it("should return null if username is empty", usernameEmpty);
  it("should return null if password is empty", passwordEmpty);
  it("should return null if prisma error occurs", prismaError);

  async function createSuccessful() {
    mockCreateUser.mockResolvedValue({
      id: mockUser.id,
      username: mockUser.username,
      password: "hashedPassword",
    });

    const result = await createUser(mockUser.username, mockUser.password);

    expect(result).toEqual({
      id: mockUser.id,
      username: mockUser.username,
      password: "hashedPassword",
    });
    expect(mockHash).toHaveBeenCalledWith(mockUser.password, 10);
    expect(mockCreateUser).toHaveBeenCalledWith({
      data: {
        username: mockUser.username,
        password: "hashedPassword",
      },
    });
  }

  async function usernameEmpty() {
    const result = await createUser("", mockUser.password);
    expect(result).toBeNull();
    expect(mockCreateUser).not.toHaveBeenCalled();
  }

  async function passwordEmpty() {
    const result = await createUser(mockUser.username, "");
    expect(result).toBeNull();
    expect(mockCreateUser).not.toHaveBeenCalled();
  }

  async function prismaError() {
    mockCreateUser.mockRejectedValue(new Error("Database error"));

    const result = await createUser(mockUser.username, mockUser.password);

    expect(result).toBeNull();
    expect(mockCreateUser).toHaveBeenCalledWith({
      data: {
        username: mockUser.username,
        password: "hashedPassword",
      },
    });
  }
});

describe("findUserByName(username: string): Promise<User | null>", () => {
  let mockFindUserByName: jest.Mock;

  beforeEach(() => {
    mockFindUserByName = prisma.user.findUnique as jest.Mock;
    jest.clearAllMocks();
  });

  it("should return a User successfully", findSuccessful);
  it("should return null if username is empty", usernameEmpty);
  it("should return null if user does not exist", userDoesNotExist);
  it("should return null if prisma error occurs", prismaError);

  async function findSuccessful() {
    mockFindUserByName.mockResolvedValue(mockUser);

    const result = await findUserByName(mockUser.username);

    expect(result).toEqual(mockUser);
    expect(mockFindUserByName).toHaveBeenCalledWith({
      where: { username: mockUser.username },
    });
  }

  async function usernameEmpty() {
    const result = await findUserByName("");

    expect(result).toBeNull();
    expect(mockFindUserByName).not.toHaveBeenCalled();
  }

  async function userDoesNotExist() {
    mockFindUserByName.mockResolvedValue(null);

    const result = await findUserByName("nonexistentuser");

    expect(result).toBeNull();
    expect(mockFindUserByName).toHaveBeenCalledWith({
      where: { username: "nonexistentuser" },
    });
  }

  async function prismaError() {
    mockFindUserByName.mockRejectedValue(new Error("Database error"));

    const result = await findUserByName(mockUser.username);

    expect(result).toBeNull();
    expect(mockFindUserByName).toHaveBeenCalledWith({
      where: { username: mockUser.username },
    });
  }
});
