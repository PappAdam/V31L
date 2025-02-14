export enum Header {
  NewMsg,
}

export interface ClientMessage {
  header: Header;
  data: any;
}
