import {
  ClientPackage,
  PublicChat,
  PublicMessage,
  ServerChatsPackage,
} from "@common";
import { deleteChatMember, findChatMembersByChat } from "../db/chatMember";
import {
  createMessage,
  findChatMessages,
  updateMessageById,
} from "../db/message";
import { extractUserIdFromToken } from "@/http/middlewares/validate";
import { Client } from "./client";
import ServerPackageSender from "./server";
import { getPublicChatsWithMessages, toPublicMessage } from "@/db/public";
import { findUserById } from "@/db/user";

// Nothing here needs validation, since the package has been validated already
async function processPackage(
  client: Client,
  incoming: ClientPackage
): Promise<void> {
  const processSuccessful = await processBasedOnHeader(client, incoming);
  await ServerPackageSender.send([client.ws], {
    header: "Acknowledgement",
    packageId: incoming.id,
    details: processSuccessful ? "Success" : "Error",
  });
}

export default processPackage;

/**
 * Processes the incoming `ClientPackage` based on its header type
 * Sends out responses as `ServerPackage`s if required
 *
 * @param client The client that sent the package
 * @param incoming The package the client sent
 * @returns {boolean} Whether the processing was successful
 */
async function processBasedOnHeader(
  client: Client,
  incoming: ClientPackage
): Promise<boolean> {
  switch (incoming.header) {
    case "Authorization":
      const tokenExtraction = extractUserIdFromToken(incoming.token);

      const user = await findUserById(tokenExtraction.userId!);

      client.user = {
        username: user!.username,
        id: user!.id,
      };

      return true;

    case "NewMessage":
      const createdMessage = await createMessage(
        incoming.chatId,
        client.user.id,
        incoming.messageContent
      );

      if (!createdMessage) {
        return false;
      }

      const chatMembers = await findChatMembersByChat(incoming.chatId);
      const responsePackage: ServerChatsPackage = {
        header: "Chats",
        chats: [
          {
            id: incoming.chatId,
            encryptedMessages: [
              {
                id: createdMessage.id,
                user: client.user,
                encryptedData: incoming.messageContent,
                timeStamp: createdMessage.timeStamp,
                pinned: createdMessage.pinned,
              },
            ],
            users: [],
          },
        ],
      };
      ServerPackageSender.send(
        chatMembers.map((member) => member.userId),
        responsePackage
      );

      return true;

    case "DeAuthorization":
      client.user = {
        username: "",
        id: "",
      };

      return true;

    case "GetChats":
      const chats: PublicChat[] = await getPublicChatsWithMessages(
        client.user.id,
        incoming.chatCount,
        incoming.messageCount
      );

      if (!chats) {
        console.error(
          "Failed to get chats with messages for user: ",
          client.user
        );
        return false;
      }

      ServerPackageSender.send([client.ws], {
        header: "Chats",
        chats,
      });
      return true;

    case "GetChatMessages":
      const messages: PublicMessage[] = (
        await findChatMessages(
          incoming.chatId,
          incoming.messageCount,
          incoming.pinnedOnly,
          incoming.fromId
        )
      ).map(toPublicMessage);

      var publicChat: PublicChat = {
        id: incoming.chatId,
        encryptedMessages: messages,
        users: [],
      };

      if (incoming.pinnedOnly) {
        ServerPackageSender.send([client.ws], {
          header: "PinnedMessages",
          messages,
        });
      } else {
        ServerPackageSender.send([client.ws], {
          header: "Chats",
          chats: [publicChat],
        });
      }

      return true;

    case "PinMessage":
      const message = await updateMessageById({
        id: incoming.messageId,
        pinned: incoming.pinState,
      });

      return !!message;

    case "LeaveChat":
      const deletedChatMember = await deleteChatMember(
        client.user.id,
        incoming.chatId
      );

      ServerPackageSender.send([client.ws], {
        header: "LeaveChat",
        chatId: incoming.chatId,
      });

      return !!deletedChatMember;

    default:
      console.error(
        "Processing for this package type has not been implemented."
      );
      return false;
  }
}
