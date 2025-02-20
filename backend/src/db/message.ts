import { Message } from "@prisma/client";
import { prisma } from "..";

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
    return newMessage;
  } catch (error) {
    console.error("Error creating message:\n", error);
    return null;
  }
}

// Update and Delete can be implemented later here, no need for it now.
