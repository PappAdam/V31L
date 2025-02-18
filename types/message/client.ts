export enum ClientHeader {
  NewMsg,
  // TODO change MessageData on connection
  Connection,
}

export interface MessageData {
  target: string;
  content: string;
}

export interface ClientMessage {
  header: ClientHeader;
  data: MessageData;
}
