export type ClientPackage = ClientConnectionPackage | ClientNewMessagePackage;

type ClientNewMessagePackage = {
  header: "NewMessage";
  chatId: string;
  messageContent: string;
};

type ClientConnectionPackage = {
  header: "Connection";
  token: string;
};
