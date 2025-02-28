import { Chat } from "@prisma/client";
import prismaMock from "../_setup/prismaMock";
import { createChat, findChatById } from "../../src/db/chat";

const mockChat: Chat = {
  id: "id-123",
  name: "name-123",
  lastMessageId: "last-id-123",
};
const mockChatIds: string[] = ["id1", "id2"];

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
    const result = await createChat(mockChat.name, mockChatIds);
    expect(result).toBe(mockChat);
    expect(prismaMock.chat.create).toHaveBeenCalledWith({
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
    expect(prismaMock.chat.create).not.toHaveBeenCalled();
  }

  async function userIdsEmpty() {
    const result = await createChat(mockChat.name, []);
    expect(result).toBeNull();
    expect(prismaMock.chat.create).not.toHaveBeenCalled();
  }

  async function prismaError() {
    prismaMock.chat.create.mockRejectedValue(new Error("Database error"));

    const result = await createChat(mockChat.name, mockChatIds);

    expect(result).toBeNull();
    expect(prismaMock.chat.create).toHaveBeenCalledWith({
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
