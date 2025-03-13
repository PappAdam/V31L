import { ChatMember } from "@prisma/client";
import prismaMock from "../_setup/prismaMock";
import {
  addUserToChat,
  findChatMember,
  findChatMembersByChat,
  findChatMembersByUser,
  removeUserFromChat,
} from "../../src/db/chatMember";

const mockChatMember: ChatMember = {
  id: "id-123",
  userId: "user-123",
  chatId: "chat-123",
  key: "Not yet implemented.",
} as const;

describe("addUserToChat(userId: string, chatId: string): Promise<ChatMember | null>", () => {
  it("should create a ChatMember successfully", createSuccessful);
  it("should return null if userId is empty", userIdEmpty);
  it("should return null if chatId is empty", chatIdEmpty);
  it("should return null if prisma error occurs", prismaError);

  async function createSuccessful() {
    prismaMock.chatMember.create.mockResolvedValue(mockChatMember);

    const result = await addUserToChat(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toEqual(mockChatMember);
    expect(prismaMock.chatMember.create).toHaveBeenCalledWith({
      data: {
        userId: mockChatMember.userId,
        chatId: mockChatMember.chatId,
        key: "Not yet implemented.",
      },
    });
  }

  async function userIdEmpty() {
    const result = await addUserToChat("", mockChatMember.chatId);
    expect(result).toBeNull();
    expect(prismaMock.chatMember.create).not.toHaveBeenCalled();
  }

  async function chatIdEmpty() {
    const result = await addUserToChat(mockChatMember.userId, "");
    expect(result).toBeNull();
    expect(prismaMock.chatMember.create).not.toHaveBeenCalled();
  }

  async function prismaError() {
    prismaMock.chatMember.create.mockRejectedValue(new Error("Database error"));

    const result = await addUserToChat(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toBeNull();
    expect(prismaMock.chatMember.create).toHaveBeenCalledWith({
      data: {
        userId: mockChatMember.userId,
        chatId: mockChatMember.chatId,
        key: "Not yet implemented.",
      },
    });
  }
});

describe("removeUserFromChat(userId: string, chatId: string): Promise<ChatMember | null>", () => {
  it("should remove a ChatMember successfully", removeSuccessful);
  it("should return null if user is not a member of the chat", userNotInChat);
  it("should return null if userId is empty", userIdEmpty);
  it("should return null if chatId is empty", chatIdEmpty);
  it("should return null if prisma error occurs", prismaError);

  async function removeSuccessful() {
    prismaMock.chatMember.delete.mockResolvedValue(mockChatMember);

    const result = await removeUserFromChat(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toEqual(mockChatMember);
    expect(prismaMock.chatMember.delete).toHaveBeenCalledWith({
      where: {
        userId_chatId: {
          userId: mockChatMember.userId,
          chatId: mockChatMember.chatId,
        },
      },
    });
  }

  async function userNotInChat() {
    prismaMock.chatMember.delete.mockRejectedValue(
      new Error("Record not found")
    );

    const result = await removeUserFromChat(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toBeNull();
    expect(prismaMock.chatMember.delete).toHaveBeenCalledWith({
      where: {
        userId_chatId: {
          userId: mockChatMember.userId,
          chatId: mockChatMember.chatId,
        },
      },
    });
  }

  async function userIdEmpty() {
    const result = await removeUserFromChat("", mockChatMember.chatId);
    expect(result).toBeNull();
    expect(prismaMock.chatMember.delete).not.toHaveBeenCalled();
  }

  async function chatIdEmpty() {
    const result = await removeUserFromChat(mockChatMember.userId, "");
    expect(result).toBeNull();
    expect(prismaMock.chatMember.delete).not.toHaveBeenCalled();
  }

  async function prismaError() {
    prismaMock.chatMember.delete.mockRejectedValue(new Error("Database error"));

    const result = await removeUserFromChat(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toBeNull();
    expect(prismaMock.chatMember.delete).toHaveBeenCalledWith({
      where: {
        userId_chatId: {
          userId: mockChatMember.userId,
          chatId: mockChatMember.chatId,
        },
      },
    });
  }
});

describe("findChatMembersByUser(userId: string): Promise<ChatMember[]>", () => {
  it("should return a ChatMember successfully", findSuccessful);
  it("should return empty array if no ChatMember exists", noChatMembersFound);
  it("should return empty array if userId is empty", userIdEmpty);
  it("should return empty array if prisma error occurs", prismaError);

  async function findSuccessful() {
    const mockChatMembers = [mockChatMember];
    prismaMock.chatMember.findMany.mockResolvedValue(mockChatMembers);

    const result = await findChatMembersByUser(mockChatMember.userId);

    expect(result).toEqual(mockChatMembers);
    expect(prismaMock.chatMember.findMany).toHaveBeenCalledWith({
      where: { userId: mockChatMember.userId },
    });
  }

  async function noChatMembersFound() {
    prismaMock.chatMember.findMany.mockResolvedValue([]);

    const result = await findChatMembersByUser(mockChatMember.userId);

    expect(result).toEqual([]);
    expect(prismaMock.chatMember.findMany).toHaveBeenCalledWith({
      where: { userId: mockChatMember.userId },
    });
  }

  async function userIdEmpty() {
    const result = await findChatMembersByUser("");
    expect(result).toEqual([]);
    expect(prismaMock.chatMember.findMany).not.toHaveBeenCalled();
  }

  async function prismaError() {
    prismaMock.chatMember.findMany.mockRejectedValue(
      new Error("Database error")
    );

    const result = await findChatMembersByUser(mockChatMember.userId);

    expect(result).toEqual([]);
    expect(prismaMock.chatMember.findMany).toHaveBeenCalledWith({
      where: { userId: mockChatMember.userId },
    });
  }
});

describe("findChatMembersByChat(chatId: string): Promise<ChatMember[] | null>", () => {
  it("should return ChatMembers successfully", findSuccessful);
  it("should return empty array if no ChatMember exists", noChatMembersFound);
  it("should return empty array if chatId is empty", chatIdEmpty);
  it("should return empty array if prisma error occurs", prismaError);

  async function findSuccessful() {
    const mockChatMembers = [mockChatMember];
    prismaMock.chatMember.findMany.mockResolvedValue(mockChatMembers);

    const result = await findChatMembersByChat(mockChatMember.chatId);

    expect(result).toEqual(mockChatMembers);
    expect(prismaMock.chatMember.findMany).toHaveBeenCalledWith({
      where: { chatId: mockChatMember.chatId },
    });
  }

  async function noChatMembersFound() {
    prismaMock.chatMember.findMany.mockResolvedValue([]);

    const result = await findChatMembersByChat(mockChatMember.chatId);

    expect(result).toEqual([]);
    expect(prismaMock.chatMember.findMany).toHaveBeenCalledWith({
      where: { chatId: mockChatMember.chatId },
    });
  }

  async function chatIdEmpty() {
    const result = await findChatMembersByChat("");
    expect(result).toEqual([]);
    expect(prismaMock.chatMember.findMany).not.toHaveBeenCalled();
  }

  async function prismaError() {
    prismaMock.chatMember.findMany.mockRejectedValue(
      new Error("Database error")
    );

    const result = await findChatMembersByChat(mockChatMember.chatId);

    expect(result).toEqual([]);
    expect(prismaMock.chatMember.findMany).toHaveBeenCalledWith({
      where: { chatId: mockChatMember.chatId },
    });
  }
});

describe("findChatMember(userId: string, chatId: string): Promise<ChatMember | null>", () => {
  it("should return a ChatMember successfully", findSuccessful);
  it("should return null if no ChatMember exists", noChatMemberFound);
  it("should return null if userId is empty", userIdEmpty);
  it("should return null if chatId is empty", chatIdEmpty);
  it("should return null if prisma error occurs", prismaError);

  async function findSuccessful() {
    prismaMock.chatMember.findUnique.mockResolvedValue(mockChatMember);

    const result = await findChatMember(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toEqual(mockChatMember);
    expect(prismaMock.chatMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_chatId: {
          userId: mockChatMember.userId,
          chatId: mockChatMember.chatId,
        },
      },
    });
  }

  async function noChatMemberFound() {
    prismaMock.chatMember.findUnique.mockResolvedValue(null);

    const result = await findChatMember(
      "nonexistentUserId",
      "nonexistentChatId"
    );

    expect(result).toBeNull();
    expect(prismaMock.chatMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_chatId: {
          userId: "nonexistentUserId",
          chatId: "nonexistentChatId",
        },
      },
    });
  }

  async function userIdEmpty() {
    const result = await findChatMember("", mockChatMember.chatId);
    expect(result).toBeNull();
    expect(prismaMock.chatMember.findUnique).not.toHaveBeenCalled();
  }

  async function chatIdEmpty() {
    const result = await findChatMember(mockChatMember.userId, "");
    expect(result).toBeNull();
    expect(prismaMock.chatMember.findUnique).not.toHaveBeenCalled();
  }

  async function prismaError() {
    prismaMock.chatMember.findUnique.mockRejectedValue(
      new Error("Database error")
    );

    const result = await findChatMember(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toBeNull();
    expect(prismaMock.chatMember.findUnique).toHaveBeenCalledWith({
      where: {
        userId_chatId: {
          userId: mockChatMember.userId,
          chatId: mockChatMember.chatId,
        },
      },
    });
  }
});
