import { Chat, Message } from "@prisma/client";
import prisma from "./_db";
import { findChatMembersByUser } from "./chatMember";
import { findChatsByUser } from "./chat";
import { ChatMessage, FMessage } from "../../../types";
import { timeStamp } from "console";
/**
 * Retrieves a specified number of messages from a chat, ordered by timestamp.
 * On limit = -1 returns all the messages.
 * Supports paging using and cursor.
 * Reveses the returned message array
 *
 * @param {string} chatId - The ID of the chat.
 * @param {number} limit - The number of messages to retrieve.
 * @param {string} cursor - The ID of the message to start fetching after (cursor-based pagination).
 */
export async function getChatMessages(
  chatId: string,
  limit: number,
  cursor?: string
): Promise<
  ({ user: { username: string } } & {
    id: string;
    chatId: string;
    userId: string;
    timeStamp: Date;
    content: string;
  })[]
> {
  try {
    if (!chatId || (limit <= 0 && limit != -1)) {
      console.warn("Invalid chatId or limit provided to getChatMessages.");
      return [];
    }

    return (
      await prisma.message.findMany({
        where: {
          chatId: chatId,
        },
        orderBy: {
          timeStamp: "desc", // Order by newest to oldest
        },
        include: {
          user: {
            select: {
              username: true, // Include the username from the User model
            },
          },
        },
        ...(limit > 0 ? { take: limit } : {}), // Limit the number of messages returned
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), // Cursor-based pagination
      })
    ).reverse();
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
): Promise<ChatMessage[] | null> {
  if (
    !userId ||
    (numberOfChats <= 0 && numberOfChats !== -1) ||
    (numberOfMessagesInFirstChat <= 0 && numberOfMessagesInFirstChat !== -1)
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
    chat: {
      id: firstChat.id,
      name: firstChat.name,
    },
  };

  if (numberOfChats !== -1) {
    chats = chats.slice(0, numberOfChats - 1);
  }

  const syncMessages = chats.map((ch) => {
    return { messages: [ch.lastMessage], chat: { id: ch.id, name: ch.name } };
  });

  syncMessages.splice(0, 0, firstChatMessages);

  return syncMessages.map((sync) => {
    return {
      chat: sync.chat,
      messages: sync.messages
        .filter((msgs) => msgs !== null)
        // msgs cannot be null
        .map((msgs) => dbMessageToFrontend(msgs as any)),
    };
  });
}

function dbMessagesToFrontend(
  syncMessages: {
    messages: (
      | {
          user: { username: string };
        } & {
          id: string;
          userId: string;
          timeStamp: Date;
          chatId: string;
          content: string;
        }
    )[];
    chat: {
      id: string;
      name: string;
    };
  }[]
): ChatMessage[] {
  return syncMessages.map((syncMessage) => {
    // Extract the chat object directly
    const chat = {
      id: syncMessage.chat.id,
      name: syncMessage.chat.name,
    };

    // Transform the messages array
    const messages: FMessage[] = syncMessage.messages.map(dbMessageToFrontend);

    // Return the ChatMessage object
    return {
      chat,
      messages,
    };
  });
}

export function dbMessageToFrontend(originalMessage: {
  user: { username: string };
  id: string;
  userId: string;
  timeStamp: Date;
  chatId: string;
  content: string;
}): FMessage {
  return {
    id: originalMessage.id,
    username: originalMessage.user.username, // Extract username from the user object
    chatId: originalMessage.chatId,
    timeStamp: originalMessage.timeStamp,
    content: originalMessage.content,
  };
}

// Update and Delete can be implemented later here, no need for it now.
// I WAS HERE BEFORE DELETE WAS IMPLEMENTED
