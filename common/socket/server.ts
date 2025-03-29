import { PublicChat } from "./public";

export type ServerPackage =
  | ServerAcknowledgement
  | ServerChatsPackage
  | ServerLeaveChatPackage
  | ServerErrorPackage;

export type ServerHeaderType = ServerPackage["header"];
export type PackageForHeader<T extends ServerHeaderType> = Extract<
  ServerPackage,
  { header: T }
>;

export type ServerAcknowledgement = {
  header: "Acknowledgement";
  packageId: string;
  details: "Success" | "Error";
};

export type ServerChatsPackage = {
  header: "Chats";
  chats: PublicChat[];
};

export type ServerLeaveChatPackage = {
  header: "LeaveChat";
  chatId: string;
};

export type ServerErrorPackage = {
  header: "Error";
  errorMessage: string;
};
