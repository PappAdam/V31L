import prisma from "../../src/db/_db";
import { addUserToChat } from "../../src/db/chatMember";

jest.mock("../../src/db/_db", () => ({
  __esModule: true,
  default: {
    chatMember: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));
const mockChatMember = {
  userId: "user-123",
  chatId: "chat-123",
  key: "Not yet implemented.",
};

describe("addUserToChat(userId: string, chatId: string): Promise<ChatMember | null>", () => {
  let mockFindFirstChatMember: jest.Mock;
  let mockCreateChatMember: jest.Mock;

  beforeEach(() => {
    mockFindFirstChatMember = prisma.chatMember.findFirst as jest.Mock;
    mockCreateChatMember = prisma.chatMember.create as jest.Mock;
  });

  it("should create a ChatMember successfully", createSuccessful);
  it("should return null if ChatMember already exists", chatMemberExists);
  it("should return null if userId is empty", userIdEmpty);
  it("should return null if chatId is empty", chatIdEmpty);
  it("should return null if prisma error occurs", prismaError);

  async function createSuccessful() {
    mockFindFirstChatMember.mockResolvedValue(null);
    mockCreateChatMember.mockResolvedValue(mockChatMember);

    const result = await addUserToChat(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toEqual(mockChatMember);
    expect(mockFindFirstChatMember).toHaveBeenCalledWith({
      where: { userId: mockChatMember.userId, chatId: mockChatMember.chatId },
    });
    expect(mockCreateChatMember).toHaveBeenCalledWith({
      data: {
        userId: mockChatMember.userId,
        chatId: mockChatMember.chatId,
        key: "Not yet implemented.",
      },
    });
  }

  async function chatMemberExists() {
    mockFindFirstChatMember.mockResolvedValue(mockChatMember);

    const result = await addUserToChat(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toBeNull();
    expect(mockFindFirstChatMember).toHaveBeenCalledWith({
      where: { userId: mockChatMember.userId, chatId: mockChatMember.chatId },
    });
    expect(mockCreateChatMember).not.toHaveBeenCalled();
  }

  async function userIdEmpty() {
    const result = await addUserToChat("", mockChatMember.chatId);
    expect(result).toBeNull();
    expect(mockFindFirstChatMember).not.toHaveBeenCalled();
  }

  async function chatIdEmpty() {
    const result = await addUserToChat(mockChatMember.userId, "");
    expect(result).toBeNull();
    expect(mockFindFirstChatMember).not.toHaveBeenCalled();
  }

  async function prismaError() {
    mockFindFirstChatMember.mockResolvedValue(null);
    mockCreateChatMember.mockRejectedValue(new Error("Database error"));

    const result = await addUserToChat(
      mockChatMember.userId,
      mockChatMember.chatId
    );

    expect(result).toBeNull();
    expect(mockFindFirstChatMember).toHaveBeenCalledWith({
      where: { userId: mockChatMember.userId, chatId: mockChatMember.chatId },
    });
    expect(mockCreateChatMember).toHaveBeenCalledWith({
      data: mockChatMember,
    });
  }
});
