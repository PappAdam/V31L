export type ClientPackageDescription =
  | ClientConnectionPackage
  | ClientNewMessagePackage
  | ClientBodyLessPackage
  | ClientInitialSync
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

export type ClientInitialSync = {
  header: "InitialSync";
  displayedGroupCount: number;
  maxDisplayableMessagCount: number;
};

export type ClientSync = {
  header: "Sync";
  messageCount: number;
  fromMessageId: string;
  chatId: string;
};
