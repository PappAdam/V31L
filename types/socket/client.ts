export type ClientPackage = ClientConnectionPackage | ClientNewMessagePackage;

export type ClientNewMessagePackage = {
  header: "NewMessage";
  chatId: string;
  messageContent: string;
};

export type ClientConnectionPackage = {
  header: "Connection";
  token: string;
};
