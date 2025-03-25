import { Request, Response, Router } from "express";
import {
  invitationCreateSuccessResponse,
  invitationInvalidResponse,
  invitationJoinSuccessResponse,
  serverErrorResponse,
} from "@common";
import { Invitation, validateChatJoinRequest } from "@/invitation";
import { addUserToChat, findChatMember } from "@/db/chatMember";
import { validateRequiredFields } from "./middlewares/validate";
import { stringToUint8Array } from "@/utils/buffers";

const invRouter = Router();
invRouter.post("/create", validateRequiredFields(["chatId"]), createInvitation);
invRouter.post("/join", validateRequiredFields(["key", "invId"]), joinChat);

export default invRouter;

/**
 * @route POST /invitations/create
 * @desc Creates a new chat invitation link with a join key
 * @param {string} req.body.key - Unique key required to join the chat
 * @param {string} req.body.chatId - ID of the chat to create invitation for
 * @returns {Object} 201 - Success response containing invitation ID
 * @returns {Object} 400 - Error response for invalid request or non-member user
 * @returns {Object} 500 - Server error response
 * @example
 * // Success response example
 * {
 *   "result": "Success",
 *   "type": "Create",
 *   "invId": "abc123-def456"
 * }
 * @example
 * // Error response example
 * {
 *   "result": "Error",
 *   "message": "Non-existent User-Chat pair"
 * }
 */
async function createInvitation(req: Request, res: Response) {
  const { chatId } = req.body;

  try {
    const chatMember = await findChatMember(req.user!.id, chatId);

    if (!chatMember) {
      res.status(400).json(invitationInvalidResponse);
      return;
    }

    const newInv = new Invitation(chatId, 60 * 1000);

    res.status(201).json(invitationCreateSuccessResponse(newInv.id));
  } catch (error) {
    console.error("Error during creating invitation: \n", error);
    res.status(500).json(serverErrorResponse);
  }
}

/**
 * @route POST /api/invitations/join
 * @desc Allows a user to join a chat using valid invitation credentials
 * @param {string} req.body.key - Join key provided in the invitation
 * @param {string} req.body.invId - Invitation ID received from creation
 * @returns {Object} 201 - Success response with joined chat ID
 * @returns {Object} 400 - Error response for invalid request or invalid invitation
 * @returns {Object} 500 - Server error response
 * @example
 * // Success response example
 * {
 *   "result": "Success",
 *   "type": "Join",
 *   "chatId": "xyz789-uvw012"
 * }
 * @example
 * // Error response example
 * {
 *   "result": "Error",
 *   "message": "Invalid Invitation"
 * }
 */
async function joinChat(req: Request, res: Response) {
  const { key, invId } = req.body;

  try {
    const invitation = validateChatJoinRequest(invId);
    if (!invitation) {
      res.status(400).json(invitationInvalidResponse);
      return;
    }

    const unwrappedKey = stringToUint8Array(key);

    if (!unwrappedKey) {
      res.status(400).json("Bad key");
    }

    const chatMember = await addUserToChat(
      req.user!.id,
      invitation.chatId,
      unwrappedKey
    );
    if (!chatMember) {
      throw Error("Failed to add user to chat");
    }

    res.status(201).json(invitationJoinSuccessResponse(chatMember.chatId));
  } catch (error) {
    console.error("Error during joining invitation: \n", error);
    res.status(500).json(serverErrorResponse);
  }
}
