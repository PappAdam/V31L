export type PublicUser = {
  id: string;
  username: string;
};

export type PublicMessage = {
  id: string;
  user: PublicUser;
  timeStamp: Date;
  content: string;
};

export type PublicChat = {
  id: string;
  name?: string;
  messages: PublicMessage[];
};
