import { ChatMember } from "@prisma/client";
import { prisma } from "..";

/**
 * Adds a user to a chat if they are not already a member.
 *
 * @param {string} userId - The ID of the user to be added to the chat.
 * @param {string} chatId - The ID of the chat to which the user will be added.
 * @returns {Promise<ChatMember | null>} `ChatMember` if the user was successfully added, `null` if the user was already a member or an error occurred.
 */
export async function addUserToChat(
  userId: string,
  chatId: string
): Promise<ChatMember | null> {
  try {
    const existingMember = await prisma.chatMember.findFirst({
      where: {
        userId: userId,
        chatId: chatId,
      },
    });
    if (existingMember) {
      return null;
    }

    const newChatMember = await prisma.chatMember.create({
      data: {
        userId,
        chatId,
        key: "Not yet implemented.",
      },
    });
    return newChatMember;
  } catch (error) {
    console.error("Error adding user to chat:\n", error);
    return null;
  }
}

/**
 * Removes a user from a chat if they are a member.
 *
 * @param {string} userId - The ID of the user to be removed from the chat.
 * @param {string} chatId - The ID of the chat from which the user will be removed.
 * @returns {Promise<ChatMember | null>} `ChatMember` if the user was successfully removed, `null` if the user was not a member or an error occurred.
 */
async function removeUserFromChat(
  userId: string,
  chatId: string
): Promise<ChatMember | null> {
  try {
    const existingMember = await prisma.chatMember.findFirst({
      where: {
        userId: userId,
        chatId: chatId,
      },
    });
    if (!existingMember) {
      return null;
    }

    const removedChatMember = await prisma.chatMember.delete({
      where: {
        id: existingMember.id,
      },
    });
    return removedChatMember;
  } catch (error) {
    console.error("Error removing user from chat:\n", error);
    return null;
  }
}
