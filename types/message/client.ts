export enum ClientHeader {
  NewMsg,
}


export interface ClientMessage {
  header: ClientHeader;
  data: any;
}

