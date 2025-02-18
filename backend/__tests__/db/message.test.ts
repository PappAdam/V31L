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

describe("createMessage", () => {
  let mockCreateMessage: jest.Mock;

  beforeEach(() => {
    mockCreateMessage = prisma.message.create as jest.Mock;
    jest.clearAllMocks();
  });

  it("should create a message successfully", async () => {
    // Arrange: Mock the return value of prisma.message.create
    const mockMessage = {
      id: "uuid",
      chatId: "chat-123",
      userId: "user-123",
      content: "Hello, World!",
    };
    mockCreateMessage.mockResolvedValue(mockMessage);

    // Act: Call createMessage function with test data
    const result = await createMessage("chat-123", "user-123", "Hello, World!");

    // Assert: The result should match the mock message
    expect(result).toEqual(mockMessage);
    expect(mockCreateMessage).toHaveBeenCalledWith({
      data: {
        chatId: "chat-123",
        userId: "user-123",
        content: "Hello, World!",
      },
    });
  });

  it("should return null if an error occurs while creating the message", async () => {
    // Arrange: Mock the create method to throw an error
    mockCreateMessage.mockRejectedValue(new Error("Database error"));

    // Act: Call createMessage function
    const result = await createMessage("chat-123", "user-123", "Hello, World!");

    // Assert: The result should be null when an error occurs
    expect(result).toBeNull();
    expect(mockCreateMessage).toHaveBeenCalledWith({
      data: {
        chatId: "chat-123",
        userId: "user-123",
        content: "Hello, World!",
      },
    });
  });
});
