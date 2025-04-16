import { AuthResponse } from "./auth";
import { InviteResponse } from "./invitation";

export type HttpResponse = AuthResponse | EmptyResponse | InviteResponse;
// Add more types here

type EmptyResponse = {};

export const unauthorizedResponse: HttpResponse = {
  result: "Error",
  message: "Unauthorized",
};
