import prismaMock from "../_setup/prismaMock";
import bcrypt from "bcryptjs";
import { createUser, findUserById, findUserByName } from "../../src/db/user";
import { User } from "@prisma/client";

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

const mockUser: User = {
  id: "id-123",
  username: "name-123",
  password: "pass-123",
  authKey: "key-123",
};

describe("createUser(username: string, password: string): Promise<User | null>", () => {
  let mockHash: jest.Mock;

  beforeAll(() => {
    mockHash = bcrypt.hash as jest.Mock;
    mockHash.mockResolvedValue("hashedPassword");
  });

  it("should create a User successfully", createSuccessful);
  it("should return null if username is empty", usernameEmpty);
  it("should return null if password is empty", passwordEmpty);
  it("should return null if prisma error occurs", prismaError);

  async function createSuccessful() {
    prismaMock.user.create.mockResolvedValue({
      id: mockUser.id,
      username: mockUser.username,
      password: "hashedPassword",
      authKey: null,
    });

    const result = await createUser(
      mockUser.username,
      mockUser.password,
      false
    );

    expect(result).toEqual({
      id: mockUser.id,
      username: mockUser.username,
      password: "hashedPassword",
      authKey: null,
    });
    expect(mockHash).toHaveBeenCalledWith(mockUser.password, 10);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        username: mockUser.username,
        password: "hashedPassword",
        authKey: null,
      },
    });
  }

  async function usernameEmpty() {
    const result = await createUser("", mockUser.password, false);
    expect(result).toBeNull();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  }

  async function passwordEmpty() {
    const result = await createUser(mockUser.username, "", false);
    expect(result).toBeNull();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  }

  async function prismaError() {
    prismaMock.user.create.mockRejectedValue(new Error("Database error"));

    const result = await createUser(
      mockUser.username,
      mockUser.password,
      false
    );

    expect(result).toBeNull();
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        username: mockUser.username,
        password: "hashedPassword",
        authKey: null,
      },
    });
  }
});

describe("findUserByName(username: string): Promise<User | null>", () => {
  it("should return a User successfully", findSuccessful);
  it("should return null if username is empty", usernameEmpty);
  it("should return null if user does not exist", userDoesNotExist);
  it("should return null if prisma error occurs", prismaError);

  async function findSuccessful() {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const result = await findUserByName(mockUser.username);

    expect(result).toEqual(mockUser);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { username: mockUser.username },
    });
  }

  async function usernameEmpty() {
    const result = await findUserByName("");

    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  }

  async function userDoesNotExist() {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await findUserByName("nonexistentuser");

    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { username: "nonexistentuser" },
    });
  }

  async function prismaError() {
    prismaMock.user.findUnique.mockRejectedValue(new Error("Database error"));

    const result = await findUserByName(mockUser.username);

    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { username: mockUser.username },
    });
  }
});

describe("findUserById(userId: string): Promise<User | null>", () => {
  it("should return a User successfully", findSuccessful);
  it("should return null if id is empty", idEmpty);
  it("should return null if user does not exist", userDoesNotExist);
  it("should return null if prisma error occurs", prismaError);

  async function findSuccessful() {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const result = await findUserById(mockUser.id);

    expect(result).toEqual(mockUser);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUser.id },
    });
  }

  async function idEmpty() {
    const result = await findUserById("");

    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  }

  async function userDoesNotExist() {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await findUserById("nonexistentid");

    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "nonexistentid" },
    });
  }

  async function prismaError() {
    prismaMock.user.findUnique.mockRejectedValue(new Error("Database error"));

    const result = await findUserById(mockUser.id);

    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUser.id },
    });
  }
});
