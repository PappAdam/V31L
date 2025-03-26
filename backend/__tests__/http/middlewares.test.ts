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

let req: Partial<Request> = {};
let res: Partial<Response> = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};
let next: NextFunction = jest.fn();

const user = {
  id: "id-123",
  username: "user-123",
  password: "password-123",
  authKey: "key-123",
};
const token = "mocked-token";
const expiredJwtPayload = {
  userId: user.id,
  exp: Math.floor(Date.now() / 1000) - 1000,
};
const validJwtPayload = {
  userId: user.id,
  exp: Math.floor(Date.now() / 1000) + 1000,
};

describe("extractUserFromTokenMiddleWare", () => {
  it("Call next() if token is valid", validToken);
  it("401 No token provided", noToken);
  it("401 Invalid or expired token (Expired token)", expiredToken);
  it("401 Invalid or expired token (Invalid token)", invalidToken);
  it("401 Invalid or expired token (User with UserId not found)", userNotFound);

  async function validToken() {
    const validToken = "valid-token";
    req.header = jest.fn().mockReturnValue(`Bearer ${validToken}`);

    await extractUserFromTokenMiddleWare(req as Request, res as Response, next);

    expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: "id-123" },
    });
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  }

  async function noToken() {
    req.header = jest.fn().mockReturnValue(null);

    await extractUserFromTokenMiddleWare(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(noTokenProvidedResponse);
    expect(next).not.toHaveBeenCalled();
  }

  async function expiredToken() {
    req.header = jest.fn().mockReturnValue(`Bearer ${token}`);

    await extractUserFromTokenMiddleWare(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(invalidTokenResponse);
    expect(next).not.toHaveBeenCalled();
  }

  async function invalidToken() {
    req.header = jest.fn().mockReturnValue(`Bearer ${token}`);

    await extractUserFromTokenMiddleWare(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(invalidTokenResponse);
    expect(next).not.toHaveBeenCalled();
  }

  async function userNotFound() {
    const validToken = "valid-token";
    req.header = jest.fn().mockReturnValue(`Bearer ${validToken}`);
    (jwt.verify as jest.Mock).mockReturnValue(validJwtPayload);

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
