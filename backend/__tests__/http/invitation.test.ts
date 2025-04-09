import request from "supertest";
import httpServer from "../../src/http/http";
import {
  invitationCreateSuccessResponse,
  invitationInvalidResponse,
  invitationJoinSuccessResponse,
  missingFieldsResponse,
  noTokenProvidedResponse,
  serverErrorResponse,
} from "@common";
import crypto from "crypto";
import { Invitation } from "@/invitation";
import * as InvitationModule from "@/invitation";
import prisma from "@/db/_db";
import { generateToken } from "@/http/auth";
import { database } from "../_setup/setup";

jest.spyOn(crypto, "randomUUID");
jest.spyOn(InvitationModule, "validateChatJoinRequest");

const createInvitationRoute = "/inv/create";
describe(`POST ${createInvitationRoute}`, () => {
  // Checks if the route is protected
  it("401 Unauthorized", noBearerToken);
  it("201 Success", success);
  it("400 Missing required fields", missingFields);
  it("400 Non-existent User-Chat pair (User not in Chat)", userNotInChat);
  it("400 Non-existent User-Chat pair (Chat does not exist)", chatNotExists);

  async function noBearerToken() {
    const response = await request(httpServer).post(createInvitationRoute);

    expect(response.status).toBe(401);
    expect(response.body).toEqual(noTokenProvidedResponse);
  }

  async function success() {
    const chatMember = database.chatMembers[0];
    const bearerToken = generateToken(chatMember.userId);
    const response = await request(httpServer)
      .post(createInvitationRoute)
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({ chatId: chatMember.chatId });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      invitationCreateSuccessResponse(response.body.invId)
    );
  }

  async function missingFields() {
    const chatMember = database.chatMembers[0];
    const bearerToken = generateToken(chatMember.userId);

    const response = await request(httpServer)
      .post(createInvitationRoute)
      .set("Authorization", `Bearer ${bearerToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(missingFieldsResponse(["chatId"]));
    expect(prisma.chatMember.findUnique).not.toHaveBeenCalled();
  }

  async function userNotInChat() {
    const chat = database.chats[0]!;
    const usersInChatIds = database.chatMembers
      .filter((cM) => cM.chatId == chat.id)
      .map((cM) => cM.userId);
    const chatMemberNotInChat = database.chatMembers.find(
      (cM) => !usersInChatIds.includes(cM.userId)
    )!;
    const bearerToken = generateToken(chatMemberNotInChat.userId);

    const response = await request(httpServer)
      .post(createInvitationRoute)
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({ chatId: chat.id });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(invitationInvalidResponse);
    expect(prisma.chatMember.findUnique).toHaveBeenCalled();
    expect(crypto.randomUUID).not.toHaveBeenCalled();
  }

  async function chatNotExists() {
    const chatMember = database.chatMembers[0];
    const bearerToken = generateToken(chatMember.userId);

    const response = await request(httpServer)
      .post(createInvitationRoute)
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({ chatId: "invalidChatId" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(invitationInvalidResponse);
    expect(prisma.chatMember.findUnique).toHaveBeenCalled();
    expect(crypto.randomUUID).not.toHaveBeenCalled();
  }
});

const joinInvitationRoute = "/inv/join";
describe(`POST ${joinInvitationRoute}`, () => {
  // Checks if the route is protected
  it("401 Unauthorized", noBearerToken);
  it("201 Success", success);
  it("400 Missing required fields", missingFields);
  it(
    "400 Non-existent User-Chat pair (User already in chat)",
    chatMemberExists
  );
  it(
    "400 Non-existent User-Chat pair (Invitation does not exist)",
    invitationNotExists
  );

  async function noBearerToken() {
    const response = await request(httpServer).post(joinInvitationRoute);

    expect(response.status).toBe(401);
    expect(response.body).toEqual(noTokenProvidedResponse);
  }

  async function success() {
    const chat = database.chats[0]!;
    const usersInChatIds = database.chatMembers
      .filter((cM) => cM.chatId == chat.id)
      .map((cM) => cM.userId);
    const chatMemberNotInChat = database.chatMembers.find(
      (cM) => !usersInChatIds.includes(cM.userId)
    )!;
    const bearerToken = generateToken(chatMemberNotInChat.userId);
    const invitation = new Invitation(chat.id, 100);

    const response = await request(httpServer)
      .post(joinInvitationRoute)
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({ key: "keyDefinedByFrontend", invId: invitation.id });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(invitationJoinSuccessResponse(chat.id));
    expect(InvitationModule.validateChatJoinRequest).toHaveBeenCalled();
    expect(prisma.chatMember.create).toHaveBeenCalled();
  }

  async function missingFields() {
    const chatMember = database.chatMembers[0];
    const bearerToken = generateToken(chatMember.userId);

    const response = await request(httpServer)
      .post(joinInvitationRoute)
      .set("Authorization", `Bearer ${bearerToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(missingFieldsResponse(["key", "invId"]));
    expect(InvitationModule.validateChatJoinRequest).not.toHaveBeenCalled();
  }

  async function chatMemberExists() {
    const chatMember = database.chatMembers[0]!;
    const bearerToken = generateToken(chatMember.userId);
    const invitation = new Invitation(chatMember.chatId, 100);

    const response = await request(httpServer)
      .post(joinInvitationRoute)
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({ key: "keyDefinedByFrontend", invId: invitation.id });

    expect(response.status).toBe(500);
    expect(response.body).toEqual(serverErrorResponse);
    expect(InvitationModule.validateChatJoinRequest).toHaveBeenCalled();
    expect(prisma.chatMember.create).toHaveBeenCalled();
  }

  async function invitationNotExists() {
    const chatMember = database.chatMembers[0];
    const bearerToken = generateToken(chatMember.userId);

    const response = await request(httpServer)
      .post(joinInvitationRoute)
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({ key: "keyDefinedByFrontend", invId: "nonexistent" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(invitationInvalidResponse);
    expect(InvitationModule.validateChatJoinRequest).toHaveBeenCalled();
    expect(prisma.chatMember.create).not.toHaveBeenCalled();
  }
});
