import { Request, Response, Router } from "express";
import {
  chatCreationSuccessResponse,
  serverErrorResponse,
  stringToCharCodeArray,
} from "@common";
import { createChatMember } from "@/db/chatMember";
import { validateRequiredFields } from "./middlewares/validate";
import { createChat } from "@/db/chat";
import { Client } from "@/socket/client";
import ServerPackageSender from "@/socket/server";
import { toPublicChat } from "@/db/public";

const chatRouter = Router();
chatRouter.post(
  "/create",
  validateRequiredFields(["name", "key", "chatImgId"]),
  createNewChat
);

export default chatRouter;

async function createNewChat(req: Request, res: Response) {
  const { name, key, chatImgId } = req.body;

  try {
    const chat = await createChat(name, chatImgId);

    if (!name) {
      res.status(400).json("No chat name was provided");
    }
    if (!chat) {
      throw Error("Failed to create chat");
    }

    const user = req.user!;
    const rawKey = stringToCharCodeArray(key, Uint8Array);
    const chatMember = await createChatMember(user.id, chat.id, rawKey);
    if (!chatMember) {
      throw Error("Failed to create chat member");
    }

    const client = Client.withUser(user.id);
    if (!client) {
      return;
    }

    const publicChat = await toPublicChat(chat.id, rawKey);
    if (!publicChat) {
      throw Error("chat is not convertable");
    }

    ServerPackageSender.send([client?.ws], {
      header: "Chats",
      chats: [publicChat],
    });

    res.status(200).json(chatCreationSuccessResponse());
    return;
  } catch (error) {
    console.error("Error during creating invitation: \n", error);
    res.status(500).json(serverErrorResponse);
  }
}
