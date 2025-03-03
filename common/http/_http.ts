import { AuthResponse } from "./auth";

export type HttpResponse = AuthResponse | EmptyResponse;
// Add more types here

type EmptyResponse = {};
