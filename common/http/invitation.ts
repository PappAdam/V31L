export type CreateInvitationSuccess = {
  invId: string;
};

export function createInvSuccess(id: string): CreateInvitationSuccess {
  return {
    invId: id,
  };
}

export type ClientCreateInvitaion = {
  header: "CreateInvitation";
  chatId: string;
  key: string;
};

export type ClientJoinChat = {
  header: "JoinChat";
  invitationID: string;
  key: string;
};
