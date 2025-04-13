import { ChatMember, User } from "@prisma/client";
import prisma from "./_db";
import { stringToCharCodeArray, UpdateChatMemberParams } from "@common";

/**
 * Adds a user to a chat if they are not already a member.
 *
 * @param {string} userId - The ID of the user to be added to the chat.
 * @param {string} chatId - The ID of the chat to which the user will be added.
 * @returns {Promise<ChatMember | null>} `ChatMember` if the user was successfully added, `null` if the user was already a member or an error occurred.
 */
export async function createChatMember(
  userId: string,
  chatId: string,
  key: Uint8Array
): Promise<ChatMember | null> {
  if (!userId || !chatId) {
    return null;
  }
  try {
    // Unique constraint will fail if the ChatMember exists, throwing an error
    const newChatMember = await prisma.chatMember.create({
      data: {
        userId,
        chatId,
        key,
      },
    });
    return newChatMember;
  } catch (error) {
    console.error("Error adding user to chat:\n", error);
    return null;
  }
}

export async function updateEncryptedChatKeys(
  params: UpdateChatMemberParams
): Promise<ChatMember[]> {
  if (!params.chatMembers?.length) {
    console.log(params.chatMembers?.length);
    return [];
  }

  try {
    const updateOperations = params.chatMembers.map((chatMember) =>
      prisma.chatMember.update({
        where: { id: chatMember.id },
        data: { key: stringToCharCodeArray(chatMember.key, Uint8Array) },
      })
    );

    const updatedMembers = await prisma.$transaction(updateOperations);
    return updatedMembers;
  } catch (error) {
    console.error("Error updating chat member keys:\n", error);
    return [];
  }
}

/**
 * Removes a user from a chat if they are a member.
 *
 * @param {string} userId - The ID of the user to be removed from the chat.
 * @param {string} chatId - The ID of the chat from which the user will be removed.
 * @returns {Promise<ChatMember | null>} `ChatMember` if the user was successfully removed, `null` if the user was not a member or an error occurred.
 */
export async function deleteChatMember(
  userId: string,
  chatId: string
): Promise<ChatMember | null> {
  if (!userId || !chatId) {
    return null;
  }
  try {
    const removedChatMember = await prisma.chatMember.delete({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });
    return removedChatMember;
  } catch (error) {
    console.error("Error removing user from chat:\n", error);
    return null;
  }
}

/**
 * Retrieves all chat memberships for a given user.
 *
 * @param {string} userId - The ID of the user whose chat memberships are being retrieved.
 * @returns {Promise<ChatMember[]>} An array of `ChatMember` objects if found, or `null` if an error occurs.
 */
export async function findChatMembersByUser(
  userId: string
): Promise<ChatMember[]> {
  if (!userId) {
    return [];
  }
  try {
    const chatMembers = await prisma.chatMember.findMany({
      where: {
        userId: userId,
      },
    });
    return chatMembers;
  } catch (error) {
    console.error("Error retrieving users chats:\n", error);
    return [];
  }
}

/**
 * Retrieves all chat memberships for a given user.
 *
 * @param {string} chatId - The ID of the chat which user memberships are being retrieved.
 * @returns {Promise<ChatMember[]>} An array of `ChatMember` objects if found, or `null` if an error occurs.
 */
export async function findChatMembersByChat(
  chatId: string
): Promise<(ChatMember & { user: User })[]> {
  if (!chatId) {
    return [];
  }
  try {
    const chatMembers = await prisma.chatMember.findMany({
      where: {
        chatId: chatId,
      },
      include: {
        user: true,
      },
    });

    return chatMembers;
  } catch (error) {
    console.error("Error retrieving chat members:\n", error);
    return [];
  }
}

/**
 * Retrieves chat membership for a given user and chat id.
 *
 * @param {string} userId - The ID of the user which membership is being retrieved.
 * @param {string} chatId - The ID of the chat which membership is being retrieved.
 * @returns {Promise<ChatMember | null>} `ChatMember` if found, or `null` if no chatMember with these ids exists.
 */
export async function findChatMember(
  userId: string,
  chatId: string
): Promise<ChatMember | null> {
  if (!userId || !chatId) {
    return null;
  }
  try {
    const chatMember = await prisma.chatMember.findUnique({
      where: { userId_chatId: { userId, chatId } },
    });

    return chatMember;
  } catch (error) {
    console.error("Error retrieving chatMember:\n", error);
    return null;
  }
}
