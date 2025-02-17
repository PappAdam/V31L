export enum ServerHeader {
  NewMsg,
}

export interface ServerMessage {
  header: ServerHeader;
  data: any;
}