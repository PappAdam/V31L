export type ServerPackage = ServerNewMessagePackage | ServerErrorPackage | ServerSyncResponsePackage;

export type ServerNewMessagePackage = {
  header: "NewMessage";
  //Author of message
  username: string;
  chatId: string;
  messageContent: string;
};

export type ServerAcknowledgement = {
  header: "Acknowledgement",
  ackMessageId: string,
  details: string,
}

export type ServerSyncResponsePackage = {
  header: "SyncResponse";
  chatMessages: {
    chatId: string,
    messages: string[],
  }[]
};

export type ServerErrorPackage = {
  header: "Error";
  errorMessage: string;
};
