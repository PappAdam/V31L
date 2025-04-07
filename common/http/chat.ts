export type ChatResponse = ChatCreateSuccess | ChatError;

export type ChatCreateSuccess = {
  result: "Success";
  type: "Create";
};

export type ChatError = { message: "Invalid chat creation" } & {
  result: "Error";
};

export const chatCreationSuccessResponse = (): ChatCreateSuccess => {
  return {
    result: "Success",
    type: "Create",
  };
};
