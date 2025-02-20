import { Chat } from "@prisma/client";
import { prisma } from "..";

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
