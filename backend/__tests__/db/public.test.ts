import { getPublicChatsWithMessages } from "@/db/public";
import { findChatsByUser } from "@/db/chat";
import { findChatMessages } from "@/db/message";

jest.mock("@/db/chat");
jest.mock("@/db/message");

describe("getPublicChatsWithMessages(userId: string, chatCount: number = 10, messageCount: number = 5): Promise<PublicChat[]>", () => {
  const userId: string = "user123";
  const chatCount: number = 2;
  const messageCount: number = 3;

  const mockChats = [
    { id: "chat1", name: "Chat 1" },
    { id: "chat2", name: "Chat 2" },
  ];

  const mockMessages = [
    { id: "msg1", content: "Message 1" },
    { id: "msg2", content: "Message 2" },
    { id: "msg3", content: "Message 3" },
  ];

  beforeEach(() => {
    (findChatsByUser as jest.Mock).mockResolvedValue(mockChats);
    (findChatMessages as jest.Mock).mockResolvedValue(mockMessages);
  });

  it("should find chats with messages successfully", findSuccessful);
  it("should return empty array if userId is empty", userIdEmpty);
  it("should return empty array if chatCount is zero", chatCountZero);
  it("should return empty array if messageCount is zero", messageCountZero);
  it("should return empty array if prisma error occurs", prismaError);

  async function findSuccessful() {
    const result = await getPublicChatsWithMessages(
      userId,
      chatCount,
      messageCount
    );
    expect(result).toEqual([
      { id: "chat1", name: "Chat 1", messages: mockMessages },
      { id: "chat2", name: "Chat 2", messages: mockMessages },
    ]);
  }

  async function userIdEmpty() {
    const result = await getPublicChatsWithMessages(
      "",
      chatCount,
      messageCount
    );
    expect(result).toStrictEqual([]);
  }

  async function chatCountZero() {
    const result = await getPublicChatsWithMessages(userId, 0, messageCount);
    expect(result).toStrictEqual([]);
    expect(findChatsByUser).not.toHaveBeenCalled();
  }

  async function messageCountZero() {
    const result = await getPublicChatsWithMessages(userId, chatCount, 0);
    expect(result).toStrictEqual([]);
  }

  async function prismaError() {
    (findChatsByUser as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const result = await getPublicChatsWithMessages(
      userId,
      chatCount,
      messageCount
    );

    expect(result).toStrictEqual([]);
    expect(findChatsByUser).toHaveBeenCalled();
  }
});
