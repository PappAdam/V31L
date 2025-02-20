import { prisma } from "../../src/index";
import { createMessage } from "../../src/db/message";

jest.mock("../../src/index", () => {
  return {
    prisma: {
      message: {
        create: jest.fn(),
      },
    },
  };
});
const mockMessage = {
  id: "uuid",
  chatId: "chat-123",
  userId: "user-123",
  content: "Hello, World!",
};

describe("createMessage(chatId: string, userId: string, content: string): Promise<Message | null>", () => {
  let mockCreateMessage: jest.Mock;

  beforeEach(() => {
    mockCreateMessage = prisma.message.create as jest.Mock;
  });

  it("should create a Message successfully", createSuccessful);
  it("should return null if chatId is empty", chatIdEmpty);
  it("should return null if userId is empty", userIdEmpty);
  it("should return null if content is empty", contentEmpty);
  it("should return null if prisma error occurs", prismaError);

  async function createSuccessful() {
    mockCreateMessage.mockResolvedValue(mockMessage);

    const result = await createMessage(
      mockMessage.chatId,
      mockMessage.userId,
      mockMessage.content
    );

    expect(result).toEqual(mockMessage);
    expect(mockCreateMessage).toHaveBeenCalledWith({
      data: {
        chatId: mockMessage.chatId,
        userId: mockMessage.userId,
        content: mockMessage.content,
      },
    });
  }

  async function chatIdEmpty() {
    const result = await createMessage(
      "",
      mockMessage.userId,
      mockMessage.content
    );

    expect(result).toEqual(null);
    expect(mockCreateMessage).not.toBeNull();
  }

  async function userIdEmpty() {
    const result = await createMessage(
      mockMessage.chatId,
      "",
      mockMessage.content
    );

    expect(result).toEqual(null);
    expect(mockCreateMessage).not.toBeNull();
  }

  async function contentEmpty() {
    const result = await createMessage(
      mockMessage.chatId,
      mockMessage.chatId,
      ""
    );

    expect(result).toEqual(null);
    expect(mockCreateMessage).not.toBeNull();
  }

  async function prismaError() {
    mockCreateMessage.mockRejectedValue(new Error("Database error"));

    const result = await createMessage(
      mockMessage.chatId,
      mockMessage.userId,
      mockMessage.content
    );

    expect(result).toBeNull();
    expect(mockCreateMessage).toHaveBeenCalledWith({
      data: {
        chatId: mockMessage.chatId,
        userId: mockMessage.userId,
        content: mockMessage.content,
      },
    });
  }
});
