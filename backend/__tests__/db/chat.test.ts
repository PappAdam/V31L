import { Chat } from "@prisma/client";
import prisma from "../../src/db/_db";
import { createChat, findChatById } from "../../src/db/chat";

jest.mock("../../src/db/_db", () => ({
  __esModule: true,
  default: {
    chat: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const mockChat: Chat = {
  id: "id-123",
  name: "name-123",
};
const mockChatIds: string[] = ["id1", "id2"];

describe("findChatById(chatId: string): Promise<Chat | null>", () => {
  let mockFindUnique: jest.Mock;

  beforeEach(() => {
    mockFindUnique = prisma.chat.findUnique as jest.Mock;
    jest.clearAllMocks();
  });

  it("should return a Chat successfully", findSuccessful);
  it("should return null if id is empty", idEmpty);
  it("should return null if chat does not exist", chatDoesNotExist);
  it("should return null if prisma error occurs", prismaError);

  async function findSuccessful() {
    mockFindUnique.mockResolvedValue(mockChat);

    const result = await findChatById(mockChat.id);

    expect(result).toEqual(mockChat);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: mockChat.id },
    });
  }

  async function idEmpty() {
    const result = await findChatById("");

    expect(result).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
  }

  async function chatDoesNotExist() {
    mockFindUnique.mockResolvedValue(null);

    const result = await findChatById("nonexistentid");

    expect(result).toBeNull();
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "nonexistentid" },
    });
  }

  async function prismaError() {
    mockFindUnique.mockRejectedValue(new Error("Database error"));

    const result = await findChatById(mockChat.id);

    expect(result).toBeNull();
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: mockChat.id },
    });
  }
});

describe("createChat(name: string, userIds: string[]): Promise<Chat | null>", () => {
  let mockCreate: jest.Mock;

  beforeEach(() => {
    mockCreate = prisma.chat.create as jest.Mock;
  });

  it("should create a Chat successfully", createSuccessful);
  it("should return null if name is empty", nameEmpty);
  it("should return null if userIds is empty", userIdsEmpty);
  it("should return null if prisma error occurs", prismaError);

  async function createSuccessful() {
    mockCreate.mockResolvedValue(mockChat);
    const result = await createChat(mockChat.name, mockChatIds);
    expect(result).toBe(mockChat);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        name: mockChat.name,
        members: {
          create: mockChatIds.map((userId) => ({
            userId: userId,
            key: "Not yet implemented.",
          })),
        },
      },
    });
  }

  async function nameEmpty() {
    const result = await createChat("", mockChatIds);
    expect(result).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  }

  async function userIdsEmpty() {
    const result = await createChat(mockChat.name, []);
    expect(result).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  }

  async function prismaError() {
    mockCreate.mockRejectedValue(new Error("Database error"));

    const result = await createChat(mockChat.name, mockChatIds);

    expect(result).toBeNull();
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        name: mockChat.name,
        members: {
          create: mockChatIds.map((userId) => ({
            userId: userId,
            key: "Not yet implemented.",
          })),
        },
      },
    });
  }
});
