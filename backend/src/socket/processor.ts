import { User } from "@prisma/client";
import { ClientPackage, ChatMessage } from "../../../types";
import { findChatMembersByChat } from "../db/chatMember";
import { createMessage, findSyncMessages } from "../db/message";
import { findUserById } from "../db/user";
import { extractUserIdFromToken } from "@/http/middlewares/validate";
import { Client } from "./client";
import ServerPackageSender from "./server";

/**
 * Processes the incoming `ClientPackage` based on its header type
 *
 * Sends out `ServerPackage`s if responses are required
 *
 * Nothing here needs validation, since the package has been validated already
 * @param client The client that sent the package
 * @param incoming The package the client sent
 */
async function processPackage(
  client: Client,
  incoming: ClientPackage
): Promise<void> {
  switch (incoming.header) {
    case "Authorization":
      const token = extractUserIdFromToken(incoming.token);
      client.userId = token.userId as string;

      await ServerPackageSender.send([client.ws], {
        header: "Acknowledgement",
        ackMessageId: incoming.id,
        details: "Auth Succesful",
      });

      break;

    case "NewMessage":
      await createMessage(
        incoming.chatId,
        client.userId,
        incoming.messageContent
      );
      const author = (await findUserById(client.userId)) as User;
      const chatMembers = await findChatMembersByChat(incoming.chatId);
      await ServerPackageSender.send(
        chatMembers.map((member) => member.id),
        {
          header: "NewMessage",
          chatId: incoming.chatId,
          messageContent: incoming.messageContent,
          username: author.username,
        }
      );
      break;

    case "DeAuthorization":
      client.userId = "";
      await ServerPackageSender.send([client.ws], {
        header: "Acknowledgement",
        ackMessageId: incoming.id,
        details: "DeAuth Succesful",
      });
      break;

    case "Sync":
      let chatMessages = await findSyncMessages(
        client.userId,
        incoming.displayedGroupCount,
        incoming.maxDisplayableMessagCount
      );

      if (!chatMessages) {
        console.error("Failed to sync chat messages for user: ", client.userId);
        break;
      }
      await ServerPackageSender.send([client.ws], {
        header: "SyncResponse",
        chatMessages: chatMessages,
      });
      break;

    default:
      console.error(
        "Processing for this package type has not been implemented."
      );
  }
}

export default processPackage;
