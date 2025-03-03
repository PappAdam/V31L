import { ClientChatMessage } from "./public";

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
  chatMessage: ClientChatMessage;
};

export type ServerAcknowledgement = {
  header: "Acknowledgement";
  packageId: string;
  details: "Success" | "Error";
};

export type ServerSyncResponsePackage = {
  header: "SyncResponse";
  chatMessages: ClientChatMessage[];
};

export type ServerErrorPackage = {
  header: "Error";
  errorMessage: string;
};
