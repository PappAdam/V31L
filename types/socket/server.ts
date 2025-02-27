export type ServerPackage = ServerNewMessagePackage | ServerErrorPackage;

export type ServerNewMessagePackage = {
  header: "NewMessage";
  //Author of message
  username: string;
  chatId: string;
  messageContent: string;
};

export type ServerSyncResponsePackage = {
  header: "SyncResponse";
  //TODO
};

export type ServerErrorPackage = {
  header: "Error";
  errorMessage: string;
};
