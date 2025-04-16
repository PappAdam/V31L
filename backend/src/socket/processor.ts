import {
  ClientPackage,
  EncryptedMessage,
  PublicChat,
  PublicMessage,
  ServerChatsPackage,
  stringToCharCodeArray,
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
import { createImage, findImageById } from "@/db/image";
import { MessageType } from "@prisma/client";

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
        profilePictureId: user!.profilePictureId,
      };

      return true;

    case "NewMessage":
      let msgType: MessageType = "TEXT";
      let content: EncryptedMessage;
      if (incoming.type == "Image") {
        const image = await createImage(
          incoming.messageContent.data,
          incoming.encoding,
          undefined,
          incoming.messageContent.iv
        );

        msgType = "IMAGE";

        if (!image) {
          return false;
        }
        content = { data: stringToCharCodeArray(image.id, Uint8Array) };
      } else {
        content = incoming.messageContent;
      }

      const createdMessage = await createMessage(
        incoming.chatId,
        client.user.id,
        content,
        msgType
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
                user: client.user.id,
                encryptedData: content,
                timeStamp: createdMessage.timeStamp,
                pinned: createdMessage.pinned,
                type: msgType,
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
        profilePictureId: "",
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

      ServerPackageSender.send([client.user.id], {
        header: "LeaveChat",
        chatId: incoming.chatId,
      });

      return !!deletedChatMember;

    case "RefreshChat":
      console.log("asd");

      const chatToRefresh: PublicChat = {
        ...incoming.chat,
        users: [],
        encryptedMessages: [],
      };

      ServerPackageSender.send([client.user.id], {
        header: "Chats",
        chats: [chatToRefresh!],
      });

    default:
      console.error(
        "Processing for this package type has not been implemented."
      );
      return false;
  }
}
