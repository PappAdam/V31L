import { PublicChatMessage } from "./public";

export type ServerPackage =
  | ServerErrorPackage
  | ServerChatMessagesPackage
  | ServerAcknowledgement;

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

export type ServerChatMessagesPackage = {
  header: "ChatMessages";
  chatMessages: PublicChatMessage[];
};

export type ServerErrorPackage = {
  header: "Error";
  errorMessage: string;
};
