import { PrismaClient } from "@prisma/client";
import { mockDeep } from "jest-mock-extended";

const prismaMock = mockDeep<PrismaClient>();
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaMock),
}));

export default prismaMock;
