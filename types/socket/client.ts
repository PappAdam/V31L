export type ClientPackageDescription =
  | ClientConnectionPackage
  | ClientNewMessagePackage
  | ClientBodyLessPackage
  | ClientSync;

export type ClientPackage = ClientPackageDescription & { id: string };

export type ClientNewMessagePackage = {
  header: "NewMessage";
  chatId: string;
  messageContent: string;
};

export type ClientConnectionPackage = {
  header: "Authorization";
  token: string;
};

export type ClientBodyLessPackage = {
  header: "DeAuthorization";
};

export type ClientSync = {
  header: "Sync";
  displayedGroupCount: number;
  maxDisplayableMessagCount: number;
};
