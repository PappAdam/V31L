import { PublicChat, PublicChatMessage, PublicMessage } from "@common";
import { findChatsByUser } from "./chat";
import { findChatMessages } from "./message";
import { Message } from "@prisma/client";
import { findUserById } from "./user";

/**
 *
 * @param originalMessage query result from database
 * @returns A client side parsable single-message description
 */
export function toPublicMessage(originalMessage: {
  user: { username: string };
  id: string;
  userId: string;
  timeStamp: Date;
  chatId: string;
  content: string;
}): PublicMessage {
  return {
    id: originalMessage.id,
    username: originalMessage.user.username,
    userId: originalMessage.userId,
    timeStamp: originalMessage.timeStamp,
    content: originalMessage.content,
  };
}

/**
 *
 * @param originalMessage query result from database
 * @returns A client side parsable single-message description
 */
export async function dbMessageToPublicMessage(
  originalMessage: Message | null
): Promise<PublicMessage | null> {
  if (!originalMessage) {
    return null;
  }

  let username = (await findUserById(originalMessage.userId))?.username;

  if (!username) {
    return null;
  }

  return {
    id: originalMessage.id,
    username: username,
    userId: originalMessage.userId,
    timeStamp: originalMessage.timeStamp,
    content: originalMessage.content,
  };
}

/**
 *
 * @param item chat description, which extends the values of {@link PublicChat}
 * @returns A {@link PublicChat} instance
 */
function toPublicChat<T extends PublicChat>(item: T): PublicChat {
  return item;
}

/**
 * Fetches and synchronizes chat messages for a user, transforming them into client-compatible formats.
 *
 * @param userId - The user's ID. Must be a non-empty string.
 * @param chatCount - Number of chats to fetch. Use `-1` for all chats. Must be positive or `-1`.
 * @param messageCount - Number of messages per chat to fetch. Use `-1` for all messages. Must be positive or `-1`.
 * @returns A promise resolving to an array of client-compatible chat messages, or `null` if inputs are invalid.
 *
 * @example
 * // Fetch 5 chats and 10 messages per chat
 * const messages = await initialMessageSync("user123", 5, 10);
 *
 * // Fetch all chats and messages
 * const messages = await initialMessageSync("user123", -1, -1);
 */
export async function initialMessageSync(
  userId: string,
  chatCount: number,
  messageCount: number
): Promise<PublicChatMessage[] | null> {
  if (
    !userId ||
    (chatCount <= 0 && chatCount !== -1) ||
    (messageCount <= 0 && messageCount !== -1)
  ) {
    return null;
  }

  let chats = await findChatsByUser(userId, chatCount);
  const chatMessages = Promise.all(
    chats.map(async (chat) => {
      let messages = await findChatMessages(chat.id, messageCount);

      return {
        chat: toPublicChat(chat),
        messages: messages.map(toPublicMessage),
      };
    })
  );

  return chatMessages;
}
