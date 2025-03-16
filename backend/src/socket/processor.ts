import {
  ClientPackage,
  PublicChat,
  PublicMessage,
  ServerChatsPackage,
} from "@common";
import { addUserToChat, findChatMembersByChat } from "../db/chatMember";
import { createMessage, findChatMessages } from "../db/message";
import { extractUserIdFromToken } from "@/http/middlewares/validate";
import { Client } from "./client";
import ServerPackageSender from "./server";
import { getPublicChatsWithMessages } from "@/db/public";
import { findUserById } from "@/db/user";
import {
  InvitationDescription,
  validateChatJoinRequest,
} from "../encryption/invitation";

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
            messages: [
              {
                id: createdMessage.id,
                user: client.user,
                content: incoming.messageContent,
                timeStamp: createdMessage.timeStamp,
              },
            ],
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
      const chats = await getPublicChatsWithMessages(
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
        chats: chats,
      });
      return true;

    case "GetChatMessages":
      const messages = (await findChatMessages(
        incoming.chatId,
        incoming.messageCount,
        incoming.fromId
      )) as PublicMessage[];

      var responsePayload: PublicChat = {
        id: incoming.chatId,
        messages,
      };

      ServerPackageSender.send([client.ws], {
        header: "Chats",
        chats: [responsePayload],
      });

      return true;

    case "CreateInvitation":
      const newInv = new InvitationDescription(
        incoming.key,
        incoming.chatId,
        60 * 1000
      );

      ServerPackageSender.send([client.ws], {
        header: "CreateInvitationResponse",
        encryptedID: newInv.hashInvitationId(),
      });
      return true;

    case "JoinChat":
      const invitation = validateChatJoinRequest(
        incoming.invitationID,
        incoming.key
      );

      if (!invitation) {
        return false;
      }

      const chatMember = addUserToChat(client.user.id, invitation.chatId);

      if (!chatMember) {
        return false;
      }

      return true;

    default:
      console.error(
        "Processing for this package type has not been implemented."
      );
      return false;
  }
}
