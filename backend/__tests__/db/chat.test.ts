import { Chat } from "@prisma/client";
import prisma from "../../src/db/_db";
import { createChat } from "../../src/db/chat";

jest.mock("../../src/db/_db", () => ({
  __esModule: true,
  default: {
    chat: {
      create: jest.fn(),
    },
  },
}));

const mockChat: Chat = {
  id: "id-123",
  name: "name-123",
};
const mockUserIds: string[] = ["id1", "id2"];

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
    const result = await createChat(mockChat.name, mockUserIds);
    expect(result).toBe(mockChat);
    expect(mockCreate).toHaveBeenCalledWith({
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
    expect(mockCreate).not.toHaveBeenCalled();
  }

  async function userIdsEmpty() {
    const result = await createChat(mockChat.name, []);
    expect(result).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  }

  async function prismaError() {
    mockCreate.mockRejectedValue(new Error("Database error"));

    const result = await createChat(mockChat.name, mockUserIds);

    expect(result).toBeNull();
    expect(mockCreate).toHaveBeenCalledWith({
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
