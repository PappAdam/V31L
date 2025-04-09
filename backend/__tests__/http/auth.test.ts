import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import httpServer from "../../src/http/http";
import {
  invalidCredentialsResponse,
  missingFieldsResponse,
  nextSetupMfaResponse,
  nextVerifyMfaResponse,
  successResponse,
  userExistsResponse,
} from "@common";
import { generateToken } from "authenticator";
import prisma from "@/db/_db";
import { database } from "../_setup/setup";
import { decryptData } from "@/encryption";
import { arrayToString } from "@common";

jest.spyOn(jwt, "sign");
jest.spyOn(bcrypt, "compare");

const registerRoute = "/auth/register";
describe(`POST ${registerRoute}`, () => {
  const newUser = { username: "newUser", password: "newPassword" };
  it("201 Success no mfa", successNoMfa);
  it("201 Next with mfa", nextWithMfa);
  it("400 Missing required fields", missingFields);
  it("400 User with username already exists", userExists);

  async function successNoMfa() {
    const response = await request(httpServer)
      .post(registerRoute)
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      successResponse(response.body.token, {
        id: response.body.id,
        username: "newUser",
        profilePictureId: response.body.profilePictureId,
      })
    );
    expect(prisma.user.create).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalled();
  }

  async function nextWithMfa() {
    const response = await request(httpServer)
      .post(registerRoute)
      .send({
        ...newUser,
        mfaEnabled: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      nextSetupMfaResponse(response.body.setupCode)
    );
    expect(prisma.user.create).toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
  }

  async function missingFields() {
    const response = await request(httpServer).post(registerRoute);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      missingFieldsResponse(["username", "password"])
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  }

  async function userExists() {
    const response = await request(httpServer).post(registerRoute).send({
      username: database.users[0].username,
      password: database.users[0].passwordNotHashed,
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(userExistsResponse);
    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  }
});

const loginRoute = "/auth/login";
describe(`POST ${loginRoute}`, () => {
  it("200 Success no MFA", successNoMfa);
  it("200 Next with MFA", nextWithMfa);
  it("200 Success with MFA", successWithMfa);
  it("400 Missing required fields", missingFields);
  it("400 Invalid credentials (Invalid username)", invalidUsername);
  it("400 Invalid credentials (Invalid password)", invalidPassword);

  async function successNoMfa() {
    const existingUserNoMfa = database.users.find((u) => !u.authKey)!;
    const response = await request(httpServer).post(loginRoute).send({
      username: existingUserNoMfa.username,
      password: existingUserNoMfa.passwordNotHashed,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      successResponse(response.body.token, existingUserNoMfa)
    );
    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalled();
  }

  async function nextWithMfa() {
    const existingUserWithMfa = database.users.find((u) => u.authKey)!;
    const response = await request(httpServer).post(loginRoute).send({
      username: existingUserWithMfa.username,
      password: existingUserWithMfa.passwordNotHashed,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(nextVerifyMfaResponse);
    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
  }

  async function successWithMfa() {
    const existingUserWithMfa = database.users.find((u) => u.authKey)!;
    const decrypted2FA = decryptData({
      encrypted: existingUserWithMfa.authKey!,
      iv: existingUserWithMfa.iv!,
      authTag: existingUserWithMfa.authTag!,
    });

    const response = await request(httpServer)
      .post(loginRoute)
      .send({
        username: existingUserWithMfa.username,
        password: existingUserWithMfa.passwordNotHashed,
        mfa: generateToken(arrayToString(decrypted2FA)),
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      successResponse(response.body.token, existingUserWithMfa)
    );
    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalled();
  }

  async function missingFields() {
    const response = await request(httpServer).post(loginRoute);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      missingFieldsResponse(["username", "password"])
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  }

  async function invalidUsername() {
    const response = await request(httpServer)
      .post(loginRoute)
      .send({ username: "invalidUsername", password: "thisDoesNotMatter" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(invalidCredentialsResponse);
    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(bcrypt.compare).not.toHaveBeenCalled();
  }

  async function invalidPassword() {
    const existingUserNoMfa = database.users.find((u) => !u.authKey)!;
    const response = await request(httpServer).post(loginRoute).send({
      username: existingUserNoMfa.username,
      password: "invalidPassword",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(invalidCredentialsResponse);
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
  }
});

// const refreshRoute = "/auth/refresh";
// describe(`POST ${refreshRoute}`, () => {
//   it("200 Success", success);
//   async function success() {
//     const newToken = "new-token";

//     const response = await request(httpServer)
//       .post(refreshRoute)
//       .set("Authorization", "Bearer " + token)
//       .send({ username: user.username, password: user.password });
//     expect(response.status).toBe(200);
//     expect(response.body).toEqual(successResponse(newToken, user));
//   }
// });
