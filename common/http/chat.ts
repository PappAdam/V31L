import { PublicChat } from "../socket/public";

export type ChatResponse = ChatCreateSuccess | ChatError;

export type ChatCreateSuccess = {
  result: "Success";
  type: "Create";
  chat: PublicChat;
};

export type ChatError = {
  result: "Error";
  message: "Invalid chat creation";
};

export const chatCreationSuccessResponse = (
  chat: PublicChat
): ChatCreateSuccess => {
  return {
    result: "Success",
    type: "Create",
    chat,
  };
};
