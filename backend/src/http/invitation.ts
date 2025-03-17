import { Request, Response, Router } from "express";
import { serverErrorResponse } from "@common";
import {
  InvitationDescription,
  validateChatJoinRequest,
} from "@/encryption/invitation";
import { createInvSuccess } from "@common";
import { addUserToChat, findChatMember } from "@/db/chatMember";

const invRouter = Router();
invRouter.post("/create", createInvitation);
invRouter.post("/join", joinChat);

export default invRouter;

async function createInvitation(req: Request, res: Response) {
  const { joinKey, chatId } = req.body;

  try {
    if (!joinKey || !chatId) {
      res.status(400);
      return;
    }

    if (!findChatMember(req.user!.id, chatId)) {
      res.status(400);
      return;
    }

    const newInv = new InvitationDescription(joinKey, chatId, 60 * 1000);

    res.status(201).json(createInvSuccess(newInv.id));
  } catch (error) {
    console.error("Error during creating invitation: \n", error);
    res.status(500).json(serverErrorResponse);
  }
}

async function joinChat(req: Request, res: Response) {
  const { key, invId } = req.body;

  try {
    if (!key || !invId) {
      res.status(400);
      return;
    }

    const invitation = validateChatJoinRequest(invId, key);
    if (!invitation) {
      res.status(400);
      return;
    }

    const chatMember = addUserToChat(req.user!.id, invitation.chatId);
    if (!chatMember) {
      throw Error("Failed to add user to chat");
    }
  } catch (error) {
    console.error("Error during creating invitation: \n", error);
    res.status(500).json(serverErrorResponse);
  }
}
