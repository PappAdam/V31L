import { prisma } from "../../src/index"; // Adjust the import path accordingly
import { addUserToChat } from "../../src/db/chatMember"; // Adjust the import path accordingly
import { ChatMember } from "@prisma/client";

jest.mock("../../src/index", () => {
  return {
    prisma: {
      chatMember: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    },
  };
});

describe("addUserToChat", () => {
  let mockFindFirst: jest.Mock;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    mockFindFirst = prisma.chatMember.findFirst as jest.Mock;
    mockCreate = prisma.chatMember.create as jest.Mock;
    jest.clearAllMocks();
  });

  it("should add the user to the chat if not already a member", async () => {
    // Arrange: Mock the findFirst method to return null (user not found)
    mockFindFirst.mockResolvedValue(null);

    const mockChatMember: ChatMember = {
      id: "uuid",
      userId: "user-123",
      chatId: "chat-123",
      key: "Not yet implemented.",
    };

    mockCreate.mockResolvedValue(mockChatMember);

    // Act: Call addUserToChat with test data
    const result = await addUserToChat("user-123", "chat-123");

    // Assert: The result should match the mock chat member and the create method should be called
    expect(result).toEqual(mockChatMember);
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { userId: "user-123", chatId: "chat-123" },
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        chatId: "chat-123",
        key: "Not yet implemented.",
      },
    });
  });

  it("should return null if the user is already a member of the chat", async () => {
    // Arrange: Mock findFirst to return an existing member (user already a member)
    const existingChatMember: ChatMember = {
      id: "existing-member-id",
      userId: "user-123",
      chatId: "chat-123",
      key: "Not yet implemented.",
    };
    mockFindFirst.mockResolvedValue(existingChatMember);

    // Act: Call addUserToChat
    const result = await addUserToChat("user-123", "chat-123");

    // Assert: The result should be null (user is already a member)
    expect(result).toBeNull();
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { userId: "user-123", chatId: "chat-123" },
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("should return null if there is an error during the process", async () => {
    // Arrange: Mock findFirst to return null, and create to throw an error
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockRejectedValue(new Error("Database error"));

    // Act: Call addUserToChat
    const result = await addUserToChat("user-123", "chat-123");

    // Assert: The result should be null when there is an error
    expect(result).toBeNull();
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { userId: "user-123", chatId: "chat-123" },
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        chatId: "chat-123",
        key: "Not yet implemented.",
      },
    });
  });
});
