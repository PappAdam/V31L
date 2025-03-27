import {
  extractUserFromTokenMiddleWare,
  validateRequiredFields,
} from "@/http/middlewares/validate";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  invalidTokenResponse,
  missingFieldsResponse,
  noTokenProvidedResponse,
} from "@common";
import prisma from "@/db/_db";
import { database } from "../_setup/setup";
import { generateToken as generateJWT } from "@/http/auth";

let req: Partial<Request> = {};
let res: Partial<Response> = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};
let next: NextFunction = jest.fn();

describe("extractUserFromTokenMiddleWare", () => {
  it("Call next() if token is valid", validToken);
  it("401 No token provided", noToken);
  it("401 Invalid or expired token (Invalid Token)", invalidToken);
  it("401 Invalid or expired token (Expired Token)", expiredToken);
  it("401 Invalid or expired token (User with UserId not found)", userNotFound);

  async function validToken() {
    const user = database.users[0];
    const bearerToken = generateJWT(user.id);

    const { passwordNotHashed, ...userResponse } = user;

    req.header = jest.fn().mockReturnValue(`Bearer ${bearerToken}`);

    await extractUserFromTokenMiddleWare(req as Request, res as Response, next);

    expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: user.id },
    });
    expect(req.user).toEqual(userResponse);
    expect(next).toHaveBeenCalled();
  }

  async function noToken() {
    req.header = jest.fn().mockReturnValue(null);

    await extractUserFromTokenMiddleWare(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(noTokenProvidedResponse);
    expect(next).not.toHaveBeenCalled();
  }

  async function invalidToken() {
    req.header = jest.fn().mockReturnValue(`Bearer invalidToken`);

    await extractUserFromTokenMiddleWare(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(invalidTokenResponse);
    expect(next).not.toHaveBeenCalled();
  }

  async function expiredToken() {
    const user = database.users[0]!;
    const bearerToken = jwt.sign({ userId: user.id }, "your_secret_key", {
      expiresIn: "-1h",
    });
    req.header = jest.fn().mockReturnValue(`Bearer ${bearerToken}`);

    await extractUserFromTokenMiddleWare(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(invalidTokenResponse);
    expect(next).not.toHaveBeenCalled();
  }

  async function userNotFound() {
    const bearerToken = generateJWT("nonExistentUserId");
    req.header = jest.fn().mockReturnValue(`Bearer ${bearerToken}`);

    await extractUserFromTokenMiddleWare(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(invalidTokenResponse);
    expect(next).not.toHaveBeenCalled();
  }
});

describe("validateRequiredFields", () => {
  it("Call next() if fields are present", () => {
    req.body = { field1: "value1", field2: "value2" };
    const middleware = validateRequiredFields(["field1", "field2"]);

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("400 Missing required fields (one missing)", () => {
    req.body = { field1: "value1" };
    const middleware = validateRequiredFields(["field1", "field2"]);

    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(missingFieldsResponse(["field2"]));
    expect(next).not.toHaveBeenCalled();
  });

  it("400 Missing required fields (all missing)", () => {
    req.body = {};
    const middleware = validateRequiredFields(["field1", "field2"]);

    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      missingFieldsResponse(["field1", "field2"])
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("Call next() if required fields is empty", () => {
    req.body = {};
    const middleware = validateRequiredFields([]);

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
