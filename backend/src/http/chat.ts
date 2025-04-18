import { Request, Response, Router } from "express";
import {
  arrayToString,
  chatCreationSuccessResponse,
  PublicChatMember,
  serverErrorResponse,
  stringToCharCodeArray,
  unauthorizedResponse,
  UpdateChatMemberParams,
} from "@common";
import {
  createChatMember,
  findChatMembersByChat,
  findChatMembersByUser,
  updateEncryptedChatKeys,
} from "@/db/chatMember";
import {
  extractUserFromTokenMiddleWare,
  validateRequiredFields,
} from "./middlewares/validate";
import { createChat, updateChat } from "@/db/chat";
import { Client } from "@/socket/client";
import ServerPackageSender from "@/socket/server";
import { toPublicChat } from "@/db/public";

const chatRouter = Router();
chatRouter.post(
  "/",
  extractUserFromTokenMiddleWare,
  validateRequiredFields(["name", "key", "chatImgId"]),
  createNewChat
);
chatRouter.put(
  "/",
  extractUserFromTokenMiddleWare,
  validateRequiredFields(["chatId"]),
  updateChatH
);

chatRouter.get("/get", findChatMembers);
chatRouter.put("/update", updateChatMemberKeys);

export default chatRouter;

async function createNewChat(req: Request, res: Response) {
  const { name, key, chatImgId } = req.body;
  const user = req.user!;

  try {
    const chat = await createChat(name, chatImgId);

    if (!chat) {
      throw Error("Failed to create chat");
    }

    const rawKey = stringToCharCodeArray(key);
    const chatMember = await createChatMember(user.id, chat.id, rawKey);
    if (!chatMember) {
      throw Error("Failed to create chat member");
    }

    const clients = Client.withUser(user.id).map((c) => c.ws);
    if (!clients) {
      return;
    }

    const publicChat = await toPublicChat(chat.id, rawKey);
    if (!publicChat) {
      throw Error("chat is not convertable");
    }

    ServerPackageSender.send(clients, {
      header: "Chats",
      chats: [publicChat],
    });

    res.json(chatCreationSuccessResponse(publicChat));
    return;
  } catch (error) {
    console.error("Error during creating invitation: \n", error);
    res.status(500).json(serverErrorResponse);
  }
}

// updateChat function name was taken (its a db function), H stands for handler.
async function updateChatH(req: Request, res: Response) {
  const { name, chatImgId, chatId } = req.body;
  const user = req.user!;

  try {
    const chatMemberIds = (await findChatMembersByChat(chatId)).map(
      (m) => m.userId
    );

    if (!chatMemberIds.includes(user.id)) {
      res.status(401).json(unauthorizedResponse);
      return;
    }

    const updatedChat = await updateChat({ id: chatId, chatImgId, name });

    if (!updatedChat) {
      throw new Error("Failed to update chat");
    }

    res.status(200).json({ message: "Success" });
  } catch (error) {
    console.error("Error during chat update: \n", error);
  }
}

async function findChatMembers(req: Request, res: Response) {
  try {
    const user = req.user!;
    const chatMembers: PublicChatMember[] = (
      await findChatMembersByUser(user.id)
    ).map((c) => {
      return {
        id: c.id,
        key: arrayToString(c.key),
      };
    });

    res.status(200).json(chatMembers);
    return;
  } catch (error) {
    console.error("Error during creating invitation: \n", error);
    res.status(500).json(serverErrorResponse);
  }
}

async function updateChatMemberKeys(
  req: Request<UpdateChatMemberParams>,
  res: Response
) {
  try {
    const chatMembers = await updateEncryptedChatKeys(req.body);
    if (!chatMembers.length) {
      res
        .status(400)
        .json({ result: "Error", message: "No chat members were updated" });
    }

    res.status(200).json({ result: "Success" });

    return;
  } catch (error) {
    console.error("Error during creating invitation: \n", error);
    res.status(500).json(serverErrorResponse);
  }
}
