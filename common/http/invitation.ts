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

type ErrorMessages = "Non-existent User-Chat pair" | "Invalid Invitation";

export const invitationCreateSuccessResponse = (
  invId: string
): InviteSuccess => {
  return {
    result: "Success",
    type: "Create",
    invId,
  };
};

export const invitationJoinSuccessResponse = (
  chatId: string
): InviteSuccess => {
  return {
    result: "Success",
    type: "Join",
    chatId,
  };
};

export const invitationInvalidResponse: InviteError = {
  result: "Error",
  message: "Non-existent User-Chat pair",
};
