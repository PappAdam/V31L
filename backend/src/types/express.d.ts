import { User } from "@prisma/client";
import * as express from "express";
import { HttpResponse } from "@common";

declare module "express" {
  interface Request {
    user?: User;
  }

  interface Response {
    json: <T extends HttpResponse>(body: T) => this;
  }
}
