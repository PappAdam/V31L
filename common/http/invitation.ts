export type InviteResponse = InviteSuccess | InviteError;

export type InviteSuccess = (CreateSuccess | JoinSuccess) & {
  result: "Success";
};

type CreateSuccess = {
  type: "Create";
  invId: string;
};

type JoinSuccess = {
  type: "Join";
  chatId: string;
};

export type InviteError = { message: ErrorMessages } & { result: "Error" };

type ErrorMessages =
  | "Invalid Request"
  | "Non-existent User-Chat pair"
  | "Invalid Invitation";
