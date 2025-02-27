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
  ackMessageId: string;
  details: string;
};

export type ServerSyncResponsePackage = {
  header: "SyncResponse";
  chatMessages: {
    chatId: string;
    messages: string[];
  }[];
};

export type ServerErrorPackage = {
  header: "Error";
  errorMessage: string;
};
