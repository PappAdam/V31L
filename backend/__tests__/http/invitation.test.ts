import request from "supertest";
import httpServer from "../../src/http/http";
import {
  invitationCreateSuccessResponse,
  invitationInvalidResponse,
  invitationJoinSuccessResponse,
  missingFieldsResponse,
  serverErrorResponse,
} from "@common";
import crypto from "crypto";
import { Invitation } from "@/encryption/invitation";
import * as InvitationModule from "@/encryption/invitation";

jest.spyOn(crypto, "randomUUID");
jest.spyOn(InvitationModule, "validateChatJoinRequest");

const createInvitationRoute = "/inv/create";
describe.only(`POST ${createInvitationRoute}`, () => {
  it("201 Success", success);
  it("400 Missing required fields", missingFields);
  it("400 Non-existent User-Chat pair", chatMemberNotExists);
  it("400 Non-existent User-Chat pair (caused by prisma error)", prismaError);

  async function success() {
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
    expect(prisma.chatMember.findUnique).not.toHaveBeenCalled();
  }

  async function chatMemberNotExists() {
    const response = await request(httpServer)
      .post(createInvitationRoute)
      .send({ key: "key-123", chatId: chatMember.chatId });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(invitationInvalidResponse);
    expect(prisma.chatMember.findUnique).toHaveBeenCalled();
    expect(crypto.randomUUID).not.toHaveBeenCalled();
  }

  async function prismaError() {
    const response = await request(httpServer)
      .post(createInvitationRoute)
      .send({ key: "key-123", chatId: chatMember.chatId });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(invitationInvalidResponse);
    expect(prisma.chatMember.findUnique).toHaveBeenCalled();
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

    const response = await request(httpServer)
      .post(joinInvitationRoute)
      .send({ key: invitation.joinKey, invId: invitation.id });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      invitationJoinSuccessResponse(chatMember.chatId)
    );
    expect(InvitationModule.validateChatJoinRequest).toHaveBeenCalled();
    expect(prisma.chatMember.create).toHaveBeenCalled();
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
    expect(prisma.chatMember.create).not.toHaveBeenCalled();
  }

  async function prismaError() {
    const invitation = new Invitation("key-123", chatMember.chatId, 60 * 1000);

    const response = await request(httpServer)
      .post(joinInvitationRoute)
      .send({ key: invitation.joinKey, invId: invitation.id });

    expect(response.status).toBe(500);
    expect(response.body).toEqual(serverErrorResponse);
    expect(prisma.chatMember.create).toHaveBeenCalled();
  }
});
