import { mockDeep } from "jest-mock-extended";
import request from "supertest";
import prismaMock from "../_setup/prismaMock";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import httpServer from "../../src/http/http";
import { Request, Response, NextFunction } from "express";
import {
  invalidCredentialsResponse,
  invitationCreateSuccessResponse,
  invitationInvalidResponse,
  missingFieldsResponse,
  serverErrorResponse,
  successResponse,
  userExistsResponse,
} from "@common";
import { ChatMember } from "@prisma/client";

const user = {
  id: "id-123",
  username: "user-123",
  password: "password-123",
  authKey: "key-123",
};
// const token = "mocked-token";
// const expiredJwtPayload = {
//   userId: user.id,
//   exp: Math.floor(Date.now() / 1000) - 1000,
// };
// const validJwtPayload = {
//   userId: user.id,
//   exp: Math.floor(Date.now() / 1000) + 1000,
// };

const cryptoMock = jest.mock("crypto", () => {
  const actualModule = jest.requireActual("crypto");
  return {
    ...actualModule,
    randomUUID: jest.fn(() => "uuid"),
  };
});

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

// jest.mock("jsonwebtoken", () => {
//   const jwtMock = mockDeep<typeof import("jsonwebtoken")>();

//   (jwtMock.sign as jest.Mock).mockReturnValue("mocked-token");
//   (jwtMock.verify as jest.Mock).mockReturnValue("id-123");

//   return {
//     __esModule: true,
//     default: jwtMock,
//   };
// });

// jest.mock("crypto", () => {
//   const cryptoMock = mockDeep<typeof import("crypto")>();

//   return {
//     __esModule: true,
//     default: cryptoMock,
//   };
// });

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
  it("500 Server error (caused by prisma error)", prismaError);

  async function success() {
    prismaMock.chatMember.findUnique.mockResolvedValue(chatMember);

    const response = await request(httpServer)
      .post(createInvitationRoute)
      .send({ key: "key-123", chatId: "chat-123" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(invitationCreateSuccessResponse("uuid"));
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
      .send({ key: "key-123", chatId: "chat-123" });

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
      .send({ key: "key-123", chatId: "chat-123" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual(serverErrorResponse);
    expect(prismaMock.chatMember.findUnique).toHaveBeenCalled();
  }
});

// const loginRoute = "/auth/login";
// describe(`POST ${loginRoute}`, () => {
//   it("201 Success", success);
//   it("400 Missing required fields", missingFields);
//   it("400 Invalid credentials (Invalid username)", invalidUsername);
//   it("400 Invalid credentials (Invalid password)", invalidPassword);

//   async function success() {
//     (bcrypt.compare as jest.Mock).mockResolvedValue(true);
//     prismaMock.user.findUnique.mockResolvedValue(user);

//     const response = await request(httpServer)
//       .post(loginRoute)
//       .send({ username: user.username, password: user.password });

//     expect(response.status).toBe(200);
//     expect(response.body).toEqual(successResponse(token, user));
//     expect(prismaMock.user.findUnique).toHaveBeenCalled();
//     expect(bcrypt.compare).toHaveBeenCalled();
//     expect(jwt.sign).toHaveBeenCalled();
//   }

//   async function missingFields() {
//     const response = await request(httpServer).post(loginRoute);

//     expect(response.status).toBe(400);
//     expect(response.body).toEqual(
//       missingFieldsResponse(["username", "password"])
//     );
//     expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
//   }

//   async function invalidUsername() {
//     prismaMock.user.findUnique.mockResolvedValue(null);

//     const response = await request(httpServer)
//       .post(loginRoute)
//       .send({ username: user.username, password: user.password });

//     expect(response.status).toBe(400);
//     expect(response.body).toEqual(invalidCredentialsResponse);
//     expect(prismaMock.user.findUnique).toHaveBeenCalled();
//     expect(bcrypt.compare).not.toHaveBeenCalled();
//   }

//   async function invalidPassword() {
//     prismaMock.user.findUnique.mockResolvedValue(user);
//     (bcrypt.compare as jest.Mock).mockResolvedValue(false);

//     const response = await request(httpServer)
//       .post(loginRoute)
//       .send({ username: user.username, password: user.password });

//     expect(response.status).toBe(400);
//     expect(response.body).toEqual(invalidCredentialsResponse);
//     expect(bcrypt.compare).toHaveBeenCalled();
//     expect(jwt.sign).not.toHaveBeenCalled();
//   }
// });

// const refreshRoute = "/auth/refresh";
// describe(`POST ${refreshRoute}`, () => {
//   (jwt.verify as jest.Mock).mockReturnValue(validJwtPayload);
//   prismaMock.user.findUniqueOrThrow.mockResolvedValue(user);

//   it("200 Success", success);
//   async function success() {
//     const newToken = "new-token";
//     (jwt.sign as jest.Mock).mockReturnValue(newToken);

//     const response = await request(httpServer)
//       .post(refreshRoute)
//       .set("Authorization", "Bearer " + token)
//       .send({ username: user.username, password: user.password });
//     expect(response.status).toBe(200);
//     expect(response.body).toEqual(successResponse(newToken, user));
//   }
// });
