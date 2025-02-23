import { Message } from "@prisma/client";
import prismaMock from "../_setup/prismaMock";
import { createMessage } from "../../src/db/message";

const mockMessage: Message = {
  id: "uuid",
  chatId: "chat-123",
  userId: "user-123",
  content: "Hello, World!",
  timeStamp: new Date(),
};

describe("createMessage(chatId: string, userId: string, content: string): Promise<Message | null>", () => {
  it("should create a Message successfully", createSuccessful);
  it("should return null if chatId is empty", chatIdEmpty);
  it("should return null if userId is empty", userIdEmpty);
  it("should return null if content is empty", contentEmpty);
  it("should return null if prisma error occurs", prismaError);

  async function createSuccessful() {
    prismaMock.message.create.mockResolvedValue(mockMessage);

    const result = await createMessage(
      mockMessage.chatId,
      mockMessage.userId,
      mockMessage.content
    );

    expect(result).toEqual(mockMessage);
    expect(prismaMock.message.create).toHaveBeenCalledWith({
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
    expect(prismaMock.message.create).not.toBeNull();
  }

  async function userIdEmpty() {
    const result = await createMessage(
      mockMessage.chatId,
      "",
      mockMessage.content
    );

    expect(result).toEqual(null);
    expect(prismaMock.message.create).not.toBeNull();
  }

  async function contentEmpty() {
    const result = await createMessage(
      mockMessage.chatId,
      mockMessage.chatId,
      ""
    );

    expect(result).toEqual(null);
    expect(prismaMock.message.create).not.toBeNull();
  }

  async function prismaError() {
    prismaMock.message.create.mockRejectedValue(new Error("Database error"));

    const result = await createMessage(
      mockMessage.chatId,
      mockMessage.userId,
      mockMessage.content
    );

    expect(result).toBeNull();
    expect(prismaMock.message.create).toHaveBeenCalledWith({
      data: {
        chatId: mockMessage.chatId,
        userId: mockMessage.userId,
        content: mockMessage.content,
      },
    });
  }
});
