export type ClientPackage =
  | ClientConnectionPackage
  | ClientNewMessagePackage
  | ClientBodyLessPackage;

export type ClientNewMessagePackage = {
  header: "NewMessage";
  chatId: string;
  messageContent: string;
};

export type ClientConnectionPackage = {
  header: "Connection";
  token: string;
};

export type ClientBodyLessPackage = {
  header: "DeAuthorization";
};
