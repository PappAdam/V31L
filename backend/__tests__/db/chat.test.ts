import { Chat } from "@prisma/client";
import prismaMock from "../_setup/prismaMock";
import { createChat, findChatById, findChatsByUser } from "../../src/db/chat";

const mockChat: Chat = {
  id: "id-123",
  name: "name-123",
  lastMessageId: "last-id-123",
};
const mockChatsArray: Awaited<ReturnType<typeof findChatsByUser>> = [
  mockChat,
  mockChat,
];

const mockUserIds: string[] = ["user-1", "user-2"];

describe("findChatById(chatId: string): Promise<Chat | null>", () => {
  it("should return a Chat successfully", findSuccessful);
  it("should return null if id is empty", idEmpty);
  it("should return null if chat does not exist", chatDoesNotExist);
  it("should return null if prisma error occurs", prismaError);

  async function findSuccessful() {
    prismaMock.chat.findUnique.mockResolvedValue(mockChat);

    const result = await findChatById(mockChat.id);

    expect(result).toEqual(mockChat);
    expect(prismaMock.chat.findUnique).toHaveBeenCalledWith({
      where: { id: mockChat.id },
    });
  }

  async function idEmpty() {
    const result = await findChatById("");

    expect(result).toBeNull();
    expect(prismaMock.chat.findUnique).not.toHaveBeenCalled();
  }

  async function chatDoesNotExist() {
    prismaMock.chat.findUnique.mockResolvedValue(null);

    const result = await findChatById("nonexistentid");

    expect(result).toBeNull();
    expect(prismaMock.chat.findUnique).toHaveBeenCalledWith({
      where: { id: "nonexistentid" },
    });
  }

  async function prismaError() {
    prismaMock.chat.findUnique.mockRejectedValue(new Error("Database error"));

    const result = await findChatById(mockChat.id);

    expect(result).toBeNull();
    expect(prismaMock.chat.findUnique).toHaveBeenCalledWith({
      where: { id: mockChat.id },
    });
  }
});

describe("createChat(name: string, userIds: string[]): Promise<Chat | null>", () => {
  it("should create a Chat successfully", createSuccessful);
  it("should return null if name is empty", nameEmpty);
  it("should return null if userIds is empty", userIdsEmpty);
  it("should return null if prisma error occurs", prismaError);

  async function createSuccessful() {
    prismaMock.chat.create.mockResolvedValue(mockChat);
    const result = await createChat(mockChat.name, mockUserIds);
    expect(result).toBe(mockChat);
    expect(prismaMock.chat.create).toHaveBeenCalledWith({
      data: {
        name: mockChat.name,
        members: {
          create: mockUserIds.map((userId) => ({
            userId: userId,
            key: "Not yet implemented.",
          })),
        },
      },
    });
  }

  async function nameEmpty() {
    const result = await createChat("", mockUserIds);
    expect(result).toBeNull();
    expect(prismaMock.chat.create).not.toHaveBeenCalled();
  }

  async function userIdsEmpty() {
    const result = await createChat(mockChat.name, []);
    expect(result).toBeNull();
    expect(prismaMock.chat.create).not.toHaveBeenCalled();
  }

  async function prismaError() {
    prismaMock.chat.create.mockRejectedValue(new Error("Database error"));

    const result = await createChat(mockChat.name, mockUserIds);

    expect(result).toBeNull();
    expect(prismaMock.chat.create).toHaveBeenCalledWith({
      data: {
        name: mockChat.name,
        members: {
          create: mockUserIds.map((userId) => ({
            userId: userId,
            key: "Not yet implemented.",
          })),
        },
      },
    });
  }
});

describe("findChatsByUser(userId: string, limit?: number, cursor?: string)", () => {
  it("should return chats successfully", findSuccessful);
  it("should return empty array if userId is empty", userIdEmpty);
  it("should return empty array if limit is invalid (0)", limitZero);
  it("should return empty array if limit is invalid (-2)", limitNegative2);
  it("should return null if prisma error occurs", prismaError);

  async function findSuccessful() {
    prismaMock.chat.findMany.mockResolvedValue(mockChatsArray);

    const result = await findChatsByUser("id-123");

    expect(result).toEqual(mockChatsArray);
    expect(prismaMock.chat.findMany).toHaveBeenCalledWith({
      where: {
        members: {
          some: {
            userId: "id-123",
          },
        },
      },
      orderBy: {
        lastMessage: {
          timeStamp: "desc",
        },
      },
    });
  }

  async function userIdEmpty() {
    const result = await findChatsByUser("");
    expect(result).toStrictEqual([]);
    expect(prismaMock.chat.findMany).not.toHaveBeenCalled();
  }

  async function limitZero() {
    const result = await findChatsByUser("id-123", 0);
    expect(result).toStrictEqual([]);
    expect(prismaMock.chat.findMany).not.toHaveBeenCalled();
  }
  async function limitNegative2() {
    const result = await findChatsByUser("id-123", -2);
    expect(result).toStrictEqual([]);
    expect(prismaMock.chat.findMany).not.toHaveBeenCalled();
  }

  async function prismaError() {
    prismaMock.chat.findMany.mockRejectedValue(new Error("Database error"));

    const result = await findChatsByUser("id-123");

    expect(result).toStrictEqual([]);
    expect(prismaMock.chat.findMany).toHaveBeenCalled();
  }
});
