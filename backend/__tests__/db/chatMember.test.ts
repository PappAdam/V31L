import prisma from "../../src/db/_db";
import {
  addUserToChat,
  findChatMember,
  findChatMembersByChat,
  findChatMembersByUser,
  removeUserFromChat,
} from "../../src/db/chatMember";

jest.mock("../../src/db/_db", () => ({
  __esModule: true,
  default: {
    chatMember: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));
const mockChatMember = {
  userId: "user-123",
  chatId: "chat-123",
  key: "Not yet implemented.",
} as const;

describe("addUserToChat(userId: string, chatId: string): Promise<ChatMember | null>", () => {
  let mockCreateChatMember: jest.Mock;

  beforeEach(() => {
    mockCreateChatMember = prisma.chatMember.create as jest.Mock;
  });

  it("should create a ChatMember successfully", createSuccessful);
  it("should return null if userId is empty", userIdEmpty);
  it("should return null if chatId is empty", chatIdEmpty);
  it("should return null if prisma error occurs", prismaError);

  async function createSuccessful() {
    mockCreateChatMember.mockResolvedValue(mockChatMember);

    const result = await addUserToChat(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toEqual(mockChatMember);
    expect(mockCreateChatMember).toHaveBeenCalledWith({
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
    expect(mockCreateChatMember).not.toHaveBeenCalled();
  }

  async function chatIdEmpty() {
    const result = await addUserToChat(mockChatMember.userId, "");
    expect(result).toBeNull();
    expect(mockCreateChatMember).not.toHaveBeenCalled();
  }

  async function prismaError() {
    mockCreateChatMember.mockRejectedValue(new Error("Database error"));

    const result = await addUserToChat(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toBeNull();
    expect(mockCreateChatMember).toHaveBeenCalledWith({
      data: mockChatMember,
    });
  }
});

describe("removeUserFromChat(userId: string, chatId: string): Promise<ChatMember | null>", () => {
  let mockDeleteChatMember: jest.Mock;

  beforeEach(() => {
    mockDeleteChatMember = prisma.chatMember.delete as jest.Mock;
  });

  it("should remove a ChatMember successfully", removeSuccessful);
  it("should return null if user is not a member of the chat", userNotInChat);
  it("should return null if userId is empty", userIdEmpty);
  it("should return null if chatId is empty", chatIdEmpty);
  it("should return null if prisma error occurs", prismaError);

  async function removeSuccessful() {
    mockDeleteChatMember.mockResolvedValue(mockChatMember);

    const result = await removeUserFromChat(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toEqual(mockChatMember);
    expect(mockDeleteChatMember).toHaveBeenCalledWith({
      where: {
        userId_chatId: {
          userId: mockChatMember.userId,
          chatId: mockChatMember.chatId,
        },
      },
    });
  }

  async function userNotInChat() {
    mockDeleteChatMember.mockRejectedValue(new Error("Record not found"));

    const result = await removeUserFromChat(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toBeNull();
    expect(mockDeleteChatMember).toHaveBeenCalledWith({
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
    expect(mockDeleteChatMember).not.toHaveBeenCalled();
  }

  async function chatIdEmpty() {
    const result = await removeUserFromChat(mockChatMember.userId, "");
    expect(result).toBeNull();
    expect(mockDeleteChatMember).not.toHaveBeenCalled();
  }

  async function prismaError() {
    mockDeleteChatMember.mockRejectedValue(new Error("Database error"));

    const result = await removeUserFromChat(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toBeNull();
    expect(mockDeleteChatMember).toHaveBeenCalledWith({
      where: {
        userId_chatId: {
          userId: mockChatMember.userId,
          chatId: mockChatMember.chatId,
        },
      },
    });
  }
});

describe("getChatMembersByUser(userId: string): Promise<ChatMember[]>", () => {
  let mockFindManyChatMembers: jest.Mock;

  beforeEach(() => {
    mockFindManyChatMembers = prisma.chatMember.findMany as jest.Mock;
  });

  it("should return a ChatMember successfully", findSuccessful);
  it("should return empty array if no ChatMember exists", noChatMembersFound);
  it("should return empty array if userId is empty", userIdEmpty);
  it("should return empty array if prisma error occurs", prismaError);

  async function findSuccessful() {
    const mockChatMembers = [mockChatMember];
    mockFindManyChatMembers.mockResolvedValue(mockChatMembers);

    const result = await findChatMembersByUser(mockChatMember.userId);

    expect(result).toEqual(mockChatMembers);
    expect(mockFindManyChatMembers).toHaveBeenCalledWith({
      where: { userId: mockChatMember.userId },
    });
  }

  async function noChatMembersFound() {
    mockFindManyChatMembers.mockResolvedValue([]);

    const result = await findChatMembersByUser(mockChatMember.userId);

    expect(result).toEqual([]);
    expect(mockFindManyChatMembers).toHaveBeenCalledWith({
      where: { userId: mockChatMember.userId },
    });
  }

  async function userIdEmpty() {
    const result = await findChatMembersByUser("");
    expect(result).toEqual([]);
    expect(mockFindManyChatMembers).not.toHaveBeenCalled();
  }

  async function prismaError() {
    mockFindManyChatMembers.mockRejectedValue(new Error("Database error"));

    const result = await findChatMembersByUser(mockChatMember.userId);

    expect(result).toEqual([]);
    expect(mockFindManyChatMembers).toHaveBeenCalledWith({
      where: { userId: mockChatMember.userId },
    });
  }
});

describe("getChatMembersByChat(chatId: string): Promise<ChatMember[] | null>", () => {
  let mockFindManyChatMembers: jest.Mock;

  beforeEach(() => {
    mockFindManyChatMembers = prisma.chatMember.findMany as jest.Mock;
  });

  it("should return ChatMembers successfully", findSuccessful);
  it("should return empty array if no ChatMember exists", noChatMembersFound);
  it("should return empty array if chatId is empty", chatIdEmpty);
  it("should return empty array if prisma error occurs", prismaError);

  async function findSuccessful() {
    const mockChatMembers = [mockChatMember];
    mockFindManyChatMembers.mockResolvedValue(mockChatMembers);

    const result = await findChatMembersByChat(mockChatMember.chatId);

    expect(result).toEqual(mockChatMembers);
    expect(mockFindManyChatMembers).toHaveBeenCalledWith({
      where: { chatId: mockChatMember.chatId },
    });
  }

  async function noChatMembersFound() {
    mockFindManyChatMembers.mockResolvedValue([]);

    const result = await findChatMembersByChat(mockChatMember.chatId);

    expect(result).toEqual([]);
    expect(mockFindManyChatMembers).toHaveBeenCalledWith({
      where: { chatId: mockChatMember.chatId },
    });
  }

  async function chatIdEmpty() {
    const result = await findChatMembersByChat("");
    expect(result).toEqual([]);
    expect(mockFindManyChatMembers).not.toHaveBeenCalled();
  }

  async function prismaError() {
    mockFindManyChatMembers.mockRejectedValue(new Error("Database error"));

    const result = await findChatMembersByChat(mockChatMember.chatId);

    expect(result).toEqual([]);
    expect(mockFindManyChatMembers).toHaveBeenCalledWith({
      where: { chatId: mockChatMember.chatId },
    });
  }
});

describe("getChatMember(userId: string, chatId: string): Promise<ChatMember | null>", () => {
  let mockFindUniqueChatMember: jest.Mock;

  beforeEach(() => {
    mockFindUniqueChatMember = prisma.chatMember.findUnique as jest.Mock;
  });

  it("should return a ChatMember successfully", findSuccessful);
  it("should return null if no ChatMember exists", noChatMemberFound);
  it("should return null if userId is empty", userIdEmpty);
  it("should return null if chatId is empty", chatIdEmpty);
  it("should return null if prisma error occurs", prismaError);

  async function findSuccessful() {
    mockFindUniqueChatMember.mockResolvedValue(mockChatMember);

    const result = await findChatMember(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toEqual(mockChatMember);
    expect(mockFindUniqueChatMember).toHaveBeenCalledWith({
      where: {
        userId_chatId: {
          userId: mockChatMember.userId,
          chatId: mockChatMember.chatId,
        },
      },
    });
  }

  async function noChatMemberFound() {
    mockFindUniqueChatMember.mockResolvedValue(null);

    const result = await findChatMember(
      "nonexistentUserId",
      "nonexistentChatId"
    );

    expect(result).toBeNull();
    expect(mockFindUniqueChatMember).toHaveBeenCalledWith({
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
    expect(mockFindUniqueChatMember).not.toHaveBeenCalled();
  }

  async function chatIdEmpty() {
    const result = await findChatMember(mockChatMember.userId, "");
    expect(result).toBeNull();
    expect(mockFindUniqueChatMember).not.toHaveBeenCalled();
  }

  async function prismaError() {
    mockFindUniqueChatMember.mockRejectedValue(new Error("Database error"));

    const result = await findChatMember(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toBeNull();
    expect(mockFindUniqueChatMember).toHaveBeenCalledWith({
      where: {
        userId_chatId: {
          userId: mockChatMember.userId,
          chatId: mockChatMember.chatId,
        },
      },
    });
  }
});
