import { PublicChat, PublicMessage, PublicUser } from "@common";
import { findChatById, findChatsByUser } from "./chat";
import { findChatMessages } from "./message";
import { Chat, Message } from "@prisma/client";
import { decryptData } from "@/encryption";
import { findChatMembersByChat } from "./chatMember";

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
  messageCount: number = 20
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
        let users = (await findChatMembersByChat(chat.id)).map((m) => {
          return { username: m.user.username, id: m.user.id };
        });

        return {
          id: chat.id,
          name: chat.name,
          encryptedMessages: messages,
          encryptedChatKey: chat.key,
          users,
        };
      })
    );
    return chatMessages;
  } catch (error) {
    console.error("Error retrieving chats with messages: ", error);
    return [];
  }
}

/**
 * Gets chats for a user with `messageCount` number of messages.
 *
 * @param chat - the chat that will be converted to PulblicChat
 * @param key - The key used for encrypting chat messages
 * @param messageCount - Number of messages in chat to fetch. Use `-1` for all messages. Must be positive or `-1`.
 * @returns A promise resolving to client-compatible chat messages, or `null` if inputs are invalid.
 */
export async function toPublicChat(
  chatId: string,
  key: Uint8Array,
  messageCount = 20
): Promise<PublicChat | null> {
  if (messageCount <= 0 && messageCount !== -1) {
    return null;
  }

  try {
    let chat = await findChatById(chatId);
    if (!chat) {
      throw Error("non existent chat");
    }

    let messages = (await findChatMessages(chat.id, messageCount)).map(
      toPublicMessage
    );
    let users = (await findChatMembersByChat(chat.id)).map((m) => {
      return { username: m.user.username, id: m.user.id };
    });

    return {
      id: chat.id,
      name: chat.name,
      encryptedMessages: messages,
      encryptedChatKey: key,
      users,
    };
  } catch (error) {
    console.error("Error retrieving chat with messages: ", error);
    return null;
  }
}

export type RawPublicMessage = { user: PublicUser } & Message;

export function toPublicMessage(msg: RawPublicMessage): PublicMessage {
  return {
    encryptedData: {
      data: decryptData({
        encrypted: msg.content,
        iv: msg.outIv,
        authTag: msg.authTag,
      }),
      iv: msg.inIv,
    },
    pinned: msg.pinned,
    id: msg.id,
    user: msg.user,
    timeStamp: msg.timeStamp,
  };
}
