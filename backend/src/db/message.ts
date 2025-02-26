import { Message } from "@prisma/client";
import prisma from "./_db";
import { findChatMembersByUser } from "./chatMember";
import { findChatsByUser } from "./chat";

/**
 * Retrieves a specified number of messages from a chat, ordered by timestamp.
 * On limit = -1 returns all the messages
 *
 * @param {string} chatId - The ID of the chat.
 * @param {number} limit - The number of messages to retrieve.
 * @returns {Promise<
 *   { id: string; userId: string; chatId: string; timeStamp: Date; content: string }[]
 * >} A promise that resolves to an array of messages.
 */
export async function getChatMessages(chatId: string, limit: number) {
  try {
    if (!chatId || (limit <= 0 && limit != -1)) {
      console.warn("Invalid chatId or limit provided to getChatMessages.");
      return [];
    }

    return await prisma.message.findMany({
      where: {
        chatId: chatId,
      },
      orderBy: {
        timeStamp: "asc", // Order by oldest to newest
      },
      ...(limit > 0 ? { take: limit } : {}), // Limit the number of messages returned
    });
  } catch (error) {
    console.error("Error retrieving messages for chat:", error);
    return [];
  }
}

/**
 * Creates a new message in a specified chat from a given user.
 *
 * @param {string} chatId - The ID of the chat where the message will be posted.
 * @param {string} userId - The ID of the user sending the message.
 * @param {string} content - The content of the message to be created.
 * @returns {Promise<Message | null>} The newly created `Message` object if successful, or `null` if an error occurs.
 */
export async function createMessage(
  chatId: string,
  userId: string,
  content: string
): Promise<Message | null> {
  if (!chatId || !userId || !content) {
    return null;
  }
  try {
    const newMessage = await prisma.message.create({
      data: {
        chatId,
        userId,
        content,
      },
    });

    await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        lastMessageId: newMessage.id,
      },
    });

    return newMessage;
  } catch (error) {
    console.error("Error creating message:\n", error);
    return null;
  }
}

/**
 * Retrieves synchronized chat messages for a user.
 *
 * - Fetches the user's chats.
 * - Retrieves a specified number of messages for the first chat.
 * - For the remaining chats, includes only the last message.
 * - Supports limiting the number of chats and messages.
 *
 * @param {string} userId - The ID of the user whose chats are to be synchronized.
 * @param {number} numberOfChats - The number of chats to retrieve (-1 for all).
 * @param {number} numberOfMessagesInFirstChat - The number of messages to retrieve from the first chat.
 * @returns {Promise<{ messages: any[]; chatId: string }[] | null>}
 *          A promise that resolves to an array of chat objects with messages, or null if no chats exist.
 */
export async function findSyncMessages(
  userId: string,
  numberOfChats: number,
  numberOfMessagesInFirstChat: number
): Promise<{ messages: any[]; chatId: string }[] | null> {
  if (
    !userId ||
    (numberOfChats <= 0 && numberOfChats !== -1) ||
    numberOfMessagesInFirstChat <= 0
  ) {
    return null;
  }

  let chats = await findChatsByUser(userId);
  if (chats.length === 0) {
    return null;
  }

  const firstChat = chats.splice(0, 1)[0];
  const firstChatMessages = {
    messages: await getChatMessages(firstChat.id, numberOfMessagesInFirstChat),
    chatId: firstChat.id,
  };

  if (numberOfChats !== -1) {
    chats = chats.slice(0, numberOfChats - 1);
  }

  const syncMessages = chats.map((ch) => {
    return { messages: [ch.lastMessage], chatId: ch.id };
  });

  syncMessages.splice(0, 0, firstChatMessages);

  return syncMessages;
}
// Update and Delete can be implemented later here, no need for it now.
// I WAS HERE BEFORE DELETE WAS IMPLEMENTED
