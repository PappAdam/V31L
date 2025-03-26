import { Message } from "@prisma/client";
import prisma from "./_db";
import { EncryptedMessage, PublicUser } from "@common";
import { encryptData } from "@/utils/encryption";
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
export async function findChatMessages(
  chatId: string,
  limit: number = 20,
  cursor?: string
): Promise<({ user: PublicUser } & Message)[]> {
  try {
    if (!chatId || (limit <= 0 && limit != -1)) {
      console.warn("Invalid chatId or limit provided to findChatMessages.");
      return [];
    }

    return (
      await prisma.message.findMany({
        where: {
          chatId: chatId,
        },
        orderBy: {
          timeStamp: "desc",
        },
        include: {
          user: {
            select: {
              username: true,
              id: true,
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
  content: EncryptedMessage
): Promise<Message | null> {
  if (!chatId || !userId || !content) {
    return null;
  }
  console.log(userId, chatId);
  try {
    const encryptedContent = encryptData(content.data);

    const newMessage = await prisma.message.create({
      data: {
        chatId,
        userId,
        content: encryptedContent.encrypted,
        inIv: content.iv,
        outIv: encryptedContent.iv,
        authTag: encryptedContent.authTag,
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

// Update and Delete can be implemented later here, no need for it now.
// I WAS HERE BEFORE DELETE WAS IMPLEMENTED
