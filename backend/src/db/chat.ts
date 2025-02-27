import { Chat } from "@prisma/client";
import prisma from "./_db";

/**
 * Gets a chat with the given id.
 *
 * @param chatId The id of the chat to get.
 *
 * @returns `Chat` if found, `null` if no chat with the given id exists.
 */
export async function findChatById(chatId: string): Promise<Chat | null> {
  if (!chatId) {
    return null;
  }
  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
    });
    return chat;
  } catch (error) {
    console.error("Error finding chat:\n", error);
    return null;
  }
}

/**
 * Creates a new chat and adds the specified users as members.
 *
 * @param {string} name - The name of the chat to be created.
 * @param {string[]} userIds - An array of user IDs to be added as members to the new chat.
 * @returns {Promise<Chat | null>} `Chat` if successful, `null` if no users are provided or an error occurs.
 */
export async function createChat(
  name: string,
  userIds: string[]
): Promise<Chat | null> {
  if (!name || userIds.length == 0) {
    return null;
  }

  try {
    const newChat = await prisma.chat.create({
      data: {
        name: name,
        members: {
          // Creating ChatMember records
          create: userIds.map((userId) => ({
            userId: userId,
            key: "Not yet implemented.",
          })),
        },
      },
    });
    return newChat;
  } catch (error) {
    console.error("Error creating chat:\n", error);
    return null;
  }
}

/**
 * Deletes a chat and its associated members from the database.
 *
 * @param {string} chatId - The ID of the chat to be deleted.
 * @returns {Promise<Chat | null>} `Chat` if successful, `null` if the chat was not found or an error occurred.
 */
export async function deleteChat(chatId: string): Promise<Chat | null> {
  try {
    const existingChat = await prisma.chat.findUnique({
      where: { id: chatId },
    });
    if (!existingChat) {
      return null;
    }

    // Delete the chat and its associated members
    const deletedChat = await prisma.chat.delete({
      where: { id: chatId },
    });
    return deletedChat;
  } catch (error) {
    console.error("Error deleting chat:\n", error);
    return null;
  }
}
/**
 * Finds all chats that a user is a member of, sorted by the date of the last message.
 *
 * @param {string} userId - The ID of the user whose chats are to be retrieved.
 * @returns {Promise<
 *   ({
 *     lastMessage: {
 *       id: string;
 *       userId: string;
 *       chatId: string;
 *       timeStamp: Date;
 *       content: string;
 *     } | null;
 *   } & { name: string; id: string; lastMessageId: string | null })[]
 * >} A promise that resolves to an array of chat objects, including the last message.
 */
export async function findChatsByUser(userId: string): Promise<
  ({
    lastMessage: {
      id: string;
      userId: string;
      chatId: string;
      timeStamp: Date;
      content: string;
    } | null;
  } & { name: string; id: string; lastMessageId: string | null })[]
> {
  try {
    if (!userId) {
      console.warn("findChatsByUser called with an empty userId");
      return [];
    }

    return await prisma.chat.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        lastMessage: true,
      },
      orderBy: {
        lastMessage: {
          timeStamp: "desc", // Order by the last message timestamp in descending order (newest first)
        },
      },
    });
  } catch (error) {
    console.error("Error retrieving chats for user:", error);
    return [];
  }
}
