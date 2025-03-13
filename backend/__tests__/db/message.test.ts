import { Message } from "@prisma/client";
import prismaMock from "../_setup/prismaMock";
import { createMessage, findChatMessages } from "@/db/message";

const mockMessage: Message = {
  id: "uuid",
  chatId: "chat-123",
  userId: "user-123",
  content: "Hello, World!",
  timeStamp: new Date(),
};

const mockChatMessages: Awaited<ReturnType<typeof findChatMessages>> = [
  {
    ...mockMessage,
    user: {
      id: "user-123",
      username: "user123",
    },
  },
];

describe("findChatMessages(chatId: string, limit: number, cursor?: string): Promise<({ user: PublicUser } & Message)[]>", () => {
  it("should find chat messages successfully", findSuccessful);
  it("should return an empty array if chatId is empty", chatIdEmpty);
  it("should return an empty array if limit is invalid (0)", limitZero);
  it("should return an empty array if limit is invalid (-2)", limitNegativeTwo);
  it("should return an empty array if prisma error occurs", prismaError);

  async function findSuccessful() {
    prismaMock.message.findMany.mockResolvedValue(mockChatMessages);

    const result = await findChatMessages("chat-123", 10);

    expect(result).toEqual(mockChatMessages);
    expect(prismaMock.message.findMany).toHaveBeenCalledWith({
      where: {
        chatId: "chat-123",
      },
      orderBy: {
        timeStamp: "desc",
      },
      include: {
        user: {
          select: {
            username: true,
            id: true,
          },
        },
      },
      take: 10,
    });
  }

  async function chatIdEmpty() {
    const result = await findChatMessages("", 10);

    expect(result).toEqual([]);
    expect(prismaMock.message.findMany).not.toHaveBeenCalled();
  }

  async function limitZero() {
    const result = await findChatMessages("chat-123", 0);

    expect(result).toEqual([]);
    expect(prismaMock.message.findMany).not.toHaveBeenCalled();
  }

  async function limitNegativeTwo() {
    const result = await findChatMessages("chat-123", -2);

    expect(result).toEqual([]);
    expect(prismaMock.message.findMany).not.toHaveBeenCalled();
  }

  async function prismaError() {
    prismaMock.message.findMany.mockRejectedValue(new Error("Database error"));

    const result = await findChatMessages("chat-123", 10);

    expect(result).toEqual([]);
    expect(prismaMock.message.findMany).toHaveBeenCalled();
  }
});

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
