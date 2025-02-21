export type ServerPackage = ServerNewMessagePackage | ServerErrorPackage;

type ServerNewMessagePackage = {
  header: "NewMessage";
  //Author of message
  username: string;
  chatId: string;
  messageContent: string;
};

type ServerErrorPackage = {
  header: "Error";
  errorMessage: string;
};
