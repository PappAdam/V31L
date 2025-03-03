import { User } from "@prisma/client";
import { ClientPackage, ChatMessage } from "../../../types";
import { findChatMembersByChat } from "../db/chatMember";
import {
  createMessage,
  dbMessageToFrontend,
  findSyncMessages,
  getChatMessages,
} from "../db/message";
import { findUserById } from "../db/user";
import { extractUserIdFromToken } from "@/http/middlewares/validate";
import { Client } from "./client";
import ServerPackageSender from "./server";
import { findChatById } from "@/db/chat";
import { create } from "domain";
import { Server } from "http";

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
      const token = extractUserIdFromToken(incoming.token);
      client.userId = token.userId as string;
      return true;

    case "NewMessage":
      await createMessage(
        incoming.chatId,
        client.userId,
        incoming.messageContent
      );
      const author = (await findUserById(client.userId)) as User;
      const chatMembers = await findChatMembersByChat(incoming.chatId);
      ServerPackageSender.send(
        chatMembers.map((member) => member.userId),
        {
          header: "NewMessage",
          chatId: incoming.chatId,
          messageContent: incoming.messageContent,
          username: author.username,
        }
      );

      return true;

    case "DeAuthorization":
      client.userId = "";
      return true;

    case "InitialSync":
      let chatMessages = await findSyncMessages(
        client.userId,
        incoming.displayedGroupCount,
        incoming.maxDisplayableMessagCount
      );

      if (!chatMessages) {
        console.error("Failed to sync chat messages for user: ", client.userId);
        return false;
      }

      ServerPackageSender.send([client.ws], {
        header: "SyncResponse",
        chatMessages: chatMessages,
      });
      return true;

    case "Sync":
      const syncMessages = (
        await getChatMessages(
          incoming.chatId,
          incoming.messageCount,
          incoming.fromMessageId
        )
      ).map(dbMessageToFrontend);

      ServerPackageSender.send([client.ws], {
        header: "SyncResponse",
        chatMessages: [
          {
            chat: {
              id: incoming.chatId,
              name: incoming.chatId,
            },
            messages: syncMessages,
          },
        ],
      });

      return true;

    default:
      console.error(
        "Processing for this package type has not been implemented."
      );
      return false;
  }
}
