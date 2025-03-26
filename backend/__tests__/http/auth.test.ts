import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import httpServer from "../../src/http/http";
import {
  invalidCredentialsResponse,
  missingFieldsResponse,
  nextSetupMfaResponse,
  nextVerifyMfaResponse,
  serverErrorResponse,
  successResponse,
  userExistsResponse,
} from "@common";
import { generateToken } from "authenticator";
import prisma from "@/db/_db";

const registerRoute = "/auth/register";
describe(`POST ${registerRoute}`, () => {
  it("201 Success no mfa", successNoMfa);
  it("201 Next with mfa", nextWithMfa);
  it("400 Missing required fields", missingFields);
  it("400 User with username already exists", userExists);
  it("500 Server error (caused by prisma error)", prismaError);

  async function successNoMfa() {
    const response = await request(httpServer)
      .post(registerRoute)
      .send({ username: user.username, password: user.password });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(successResponse(token, user));
    expect(prisma.user.create).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalled();
  }

  async function nextWithMfa() {
    const response = await request(httpServer).post(registerRoute).send({
      username: user.username,
      password: user.password,
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
    const response = await request(httpServer)
      .post(registerRoute)
      .send({ username: user.username, password: user.password });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(userExistsResponse);
    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  }

  async function prismaError() {
    const response = await request(httpServer)
      .post(registerRoute)
      .send({ username: user.username, password: user.password });

    expect(response.status).toBe(500);
    expect(response.body).toEqual(serverErrorResponse);
    expect(prisma.user.create).toHaveBeenCalled();
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
    const response = await request(httpServer)
      .post(loginRoute)
      .send({ username: user.username, password: user.password });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(successResponse(token, user));
    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalled();
  }

  async function nextWithMfa() {
    const response = await request(httpServer)
      .post(loginRoute)
      .send({ username: user.username, password: user.password });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(nextVerifyMfaResponse);
    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
  }

  async function successWithMfa() {
    const response = await request(httpServer)
      .post(loginRoute)
      .send({
        username: user.username,
        password: user.password,
        mfa: generateToken(user.authKey),
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(successResponse(token, user));
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
      .send({ username: user.username, password: user.password });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(invalidCredentialsResponse);
    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(bcrypt.compare).not.toHaveBeenCalled();
  }

  async function invalidPassword() {
    const response = await request(httpServer)
      .post(loginRoute)
      .send({ username: user.username, password: user.password });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(invalidCredentialsResponse);
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
  }
});

const refreshRoute = "/auth/refresh";
describe(`POST ${refreshRoute}`, () => {
  it("200 Success", success);
  async function success() {
    const newToken = "new-token";

    const response = await request(httpServer)
      .post(refreshRoute)
      .set("Authorization", "Bearer " + token)
      .send({ username: user.username, password: user.password });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(successResponse(newToken, user));
  }
});
