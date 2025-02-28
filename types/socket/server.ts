import { ChatMessage } from "./public";

export type ServerPackage =
  | ServerNewMessagePackage
  | ServerErrorPackage
  | ServerSyncResponsePackage
  | ServerAcknowledgement;

export type ServerHeaderType = ServerPackage["header"];
export type PackageForHeader<T extends ServerHeaderType> = Extract<
  ServerPackage,
  { header: T }
>;

export type ServerNewMessagePackage = {
  header: "NewMessage";
  //Author of message
  username: string;
  chatId: string;
  messageContent: string;
};

export type ServerAcknowledgement = {
  header: "Acknowledgement";
  packageId: string;
  details: "Success" | "Error";
};

export type ServerSyncResponsePackage = {
  header: "SyncResponse";
  chatMessages: ChatMessage[];
};

export type ServerErrorPackage = {
  header: "Error";
  errorMessage: string;
};
