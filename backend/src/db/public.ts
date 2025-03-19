import { PublicChat, PublicMessage, PublicUser } from "@common";
import { findChatsByUser } from "./chat";
import { findChatMessages } from "./message";
import { Message } from "@prisma/client";

/**
 * Gets chats for a user with `messageCount` number of messages.
 *
 * @param userId - The user's ID. Must be a non-empty string.
 * @param chatCount - Number of chats to fetch. Use `-1` for all chats. Must be positive or `-1`.
 * @param messageCount - Number of messages per chat to fetch. Use `-1` for all messages. Must be positive or `-1`.
 * @returns A promise resolving to an array of client-compatible chat messages, or `null` if inputs are invalid.
 */
export async function getPublicChatsWithMessages(
  userId: string,
  chatCount: number = 10,
  messageCount: number = 5
): Promise<PublicChat[]> {
  if (
    !userId ||
    (chatCount <= 0 && chatCount !== -1) ||
    (messageCount <= 0 && messageCount !== -1)
  ) {
    return [];
  }

  try {
    let chats = await findChatsByUser(userId, chatCount);
    const chatMessages = Promise.all(
      chats.map(async (chat) => {
        let messages = (await findChatMessages(chat.id, messageCount)).map(
          toPublicMessage
        );

        return {
          id: chat.id,
          name: chat.name,
          encryptedMessages: messages,
        };
      })
    );
    return chatMessages;
  } catch (error) {
    console.error("Error retrieving chats with messages: ", error);
    return [];
  }
}

export type RawPublicMessage = { user: PublicUser } & Message;

export function toPublicMessage(msg: RawPublicMessage): PublicMessage {
  return {
    encryptedData: {
      data: msg.content,
      iv: msg.iv,
    },
    id: msg.id,
    user: msg.user,
    timeStamp: msg.timeStamp,
  };
}
