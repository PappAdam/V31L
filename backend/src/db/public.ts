import { PublicChat } from "@common";
import { findChatsByUser } from "./chat";
import { findChatMessages } from "./message";

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
export async function getPublicChatsWithMessages(
  userId: string,
  chatCount: number,
  messageCount: number
): Promise<PublicChat[] | null> {
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
        id: chat.id,
        name: chat.name,
        messages,
      };
    })
  );

  return chatMessages;
}
