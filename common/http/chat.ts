import { PublicChat } from "../socket/public";

export type ChatResponse = ChatSuccess | ChatError;

export type ChatSuccess = {
  result: "Success";
  type: "Create" | "Update";
  chat: PublicChat;
};

export type ChatError = {
  result: "Error";
  message: "Invalid chat creation";
};

export const chatCreationSuccessResponse = (chat: PublicChat): ChatSuccess => {
  return {
    result: "Success",
    type: "Create",
    chat,
  };
};

export const chatUpdateSuccessResponse = (chat: PublicChat): ChatSuccess => {
  return {
    result: "Success",
    type: "Update",
    chat,
  };
};
export type PublicChatMember = {
  id: string;
  key: string;
};

export interface UpdateChatMemberParams {
  chatMembers: PublicChatMember[];
}
