import { User } from "@prisma/client";
import { ClientPackage, ServerPackage } from "../../../types";
import { findChatMembersByChat } from "../db/chatMember";
import { createMessage, findSyncMessages } from "../db/message";
import { findUserById } from "../db/user";
import { extractUserIdFromToken } from "@/http/middlewares/validate";
import { Client } from "./client";
import { ServerPackageSender } from "./server";

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

      break;

    case "NewMessage":
      await createMessage(
        incoming.chatId,
        client.userId,
        incoming.messageContent
      );
      const author = (await findUserById(client.userId)) as User;
      const newMessagePackage: ServerPackage = {
        header: "NewMessage",
        chatId: incoming.chatId,
        messageContent: incoming.messageContent,
        username: author.username,
      };
      const chatMembers = await findChatMembersByChat(incoming.chatId);
      chatMembers.forEach((chatMember) => {
        const packageDescription = new ServerPackageSender(
          chatMember.userId,
          newMessagePackage
        );
        packageDescription.sendPackage();
      });

    case "DeAuthorization":
      client.userId = "";
      break;
    case "Sync":

    default:
      console.error(
        "Processing for this package type has not been implemented."
      );
  }
}

export default processPackage;
