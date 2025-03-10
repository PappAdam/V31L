import { PublicChatContent } from "./public";

export type ServerPackage =
  | ServerErrorPackage
  | ServerChatContentPackage
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

export type ServerChatContentPackage = {
  header: "ChatContent";
  chatMessages: PublicChatContent[];
};

export type ServerErrorPackage = {
  header: "Error";
  errorMessage: string;
};
