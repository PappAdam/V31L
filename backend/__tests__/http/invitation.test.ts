import request from "supertest";
import prismaMock from "../_setup/prismaMock";
import httpServer from "../../src/http/http";
import { Request, Response, NextFunction } from "express";
import {
  invitationCreateSuccessResponse,
  invitationInvalidResponse,
  invitationJoinSuccessResponse,
  missingFieldsResponse,
  serverErrorResponse,
} from "@common";
import { ChatMember } from "@prisma/client";
import crypto from "crypto";
import { Invitation } from "@/encryption/invitation";
import * as InvitationModule from "@/encryption/invitation";

const user = {
  id: "id-123",
  username: "user-123",
  password: "password-123",
  authKey: "key-123",
};
jest.spyOn(crypto, "randomUUID");
jest.spyOn(InvitationModule, "validateChatJoinRequest");

jest.mock("@/http/middlewares/validate", () => {
  const actualModule = jest.requireActual("@/http/middlewares/validate");
  return {
    ...actualModule,
    extractUserFromTokenMiddleWare: jest.fn(
      async (req: Request, res: Response, next: NextFunction) => {
        req.user = user;
        next();
      }
    ),
  };
});

const chatMember: ChatMember = {
  id: "id-123",
  userId: "user-123",
  chatId: "chat-123",
  key: "key-123",
};

const createInvitationRoute = "/inv/create";
describe.only(`POST ${createInvitationRoute}`, () => {
  it("201 Success", success);
  it("400 Missing required fields", missingFields);
  it("400 Non-existent User-Chat pair", chatMemberNotExists);
  it("400 Non-existent User-Chat pair (caused by prisma error)", prismaError);

  async function success() {
    prismaMock.chatMember.findUnique.mockResolvedValue(chatMember);

    const response = await request(httpServer)
      .post(createInvitationRoute)
      .send({ key: "key-123", chatId: chatMember.chatId });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      invitationCreateSuccessResponse(response.body.invId)
    );
  }

  async function missingFields() {
    const response = await request(httpServer).post(createInvitationRoute);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(missingFieldsResponse(["key", "chatId"]));
    expect(prismaMock.chatMember.findUnique).not.toHaveBeenCalled();
  }

  async function chatMemberNotExists() {
    prismaMock.chatMember.findUnique.mockResolvedValue(null);

    const response = await request(httpServer)
      .post(createInvitationRoute)
      .send({ key: "key-123", chatId: chatMember.chatId });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(invitationInvalidResponse);
    expect(prismaMock.chatMember.findUnique).toHaveBeenCalled();
    expect(crypto.randomUUID).not.toHaveBeenCalled();
  }

  async function prismaError() {
    prismaMock.chatMember.findUnique.mockRejectedValue(
      new Error("Database error")
    );

    const response = await request(httpServer)
      .post(createInvitationRoute)
      .send({ key: "key-123", chatId: chatMember.chatId });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(invitationInvalidResponse);
    expect(prismaMock.chatMember.findUnique).toHaveBeenCalled();
  }
});

const joinInvitationRoute = "/inv/join";
describe.only(`POST ${joinInvitationRoute}`, () => {
  it("201 Success", success);
  it("400 Missing required fields", missingFields);
  it("400 Non-existent User-Chat pair", invitationNotExists);
  it("400 Non-existent User-Chat pair (caused by prisma error)", prismaError);

  async function success() {
    const invitation = new Invitation("key-123", chatMember.chatId, 60 * 1000);
    prismaMock.chatMember.create.mockResolvedValue(chatMember);

    const response = await request(httpServer)
      .post(joinInvitationRoute)
      .send({ key: invitation.joinKey, invId: invitation.id });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      invitationJoinSuccessResponse(chatMember.chatId)
    );
    expect(InvitationModule.validateChatJoinRequest).toHaveBeenCalled();
    expect(prismaMock.chatMember.create).toHaveBeenCalled();
  }

  async function missingFields() {
    const response = await request(httpServer).post(joinInvitationRoute);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(missingFieldsResponse(["key", "invId"]));
    expect(InvitationModule.validateChatJoinRequest).not.toHaveBeenCalled();
  }

  async function invitationNotExists() {
    const response = await request(httpServer)
      .post(joinInvitationRoute)
      .send({ key: "nonexistent", invId: "nonexistent" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(invitationInvalidResponse);
    expect(InvitationModule.validateChatJoinRequest).toHaveBeenCalled();
    expect(prismaMock.chatMember.create).not.toHaveBeenCalled();
  }

  async function prismaError() {
    const invitation = new Invitation("key-123", chatMember.chatId, 60 * 1000);
    prismaMock.chatMember.create.mockRejectedValue(new Error("Database error"));

    const response = await request(httpServer)
      .post(joinInvitationRoute)
      .send({ key: invitation.joinKey, invId: invitation.id });

    expect(response.status).toBe(500);
    expect(response.body).toEqual(serverErrorResponse);
    expect(prismaMock.chatMember.create).toHaveBeenCalled();
  }
});
