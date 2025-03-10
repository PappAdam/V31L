import { ClientPackage } from "@common";
import { findChatMembersByChat } from "../db/chatMember";
import { createMessage, findChatMessages } from "../db/message";
import { extractUserIdFromToken } from "@/http/middlewares/validate";
import { Client } from "./client";
import ServerPackageSender from "./server";
import {
  initialMessageSync,
  dbMessageToPublicMessage,
  toPublicMessage,
} from "@/db/dbHelpers";

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
      let newMessage = await dbMessageToPublicMessage(
        await createMessage(
          incoming.chatId,
          client.userId,
          incoming.messageContent
        )
      );

      if (!newMessage) {
        return false;
      }

      const chatMembers = await findChatMembersByChat(incoming.chatId);

      ServerPackageSender.send(
        chatMembers.map((member) => member.userId),
        {
          header: "ChatContent",
          chatMessages: [
            {
              chat: {
                id: incoming.chatId,
              },
              messages: [newMessage],
            },
          ],
        }
      );

      return true;

    case "DeAuthorization":
      client.userId = "";
      return true;

    case "GetChats":
      let chatMessages = await initialMessageSync(
        client.userId,
        incoming.chatCount,
        incoming.messageCount
      );

      if (!chatMessages) {
        console.error("Failed to sync chat messages for user: ", client.userId);
        return false;
      }

      ServerPackageSender.send([client.ws], {
        header: "ChatContent",
        chatMessages: chatMessages,
      });

      return true;

    case "GetChatMessages":
      const syncMessages = (
        await findChatMessages(
          incoming.chatId,
          incoming.messageCount,
          incoming.fromId
        )
      ).map(toPublicMessage);

      ServerPackageSender.send([client.ws], {
        header: "ChatContent",
        chatMessages: [
          {
            chat: {
              id: incoming.chatId,
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
