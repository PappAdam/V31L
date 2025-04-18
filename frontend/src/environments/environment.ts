const url = 'veil.com';
const httpProtocol = 'https';
const httpPort = 3000;
const socketProtocol = 'wss';
const socketPort = 8080;

export const environment = {
  httpUrl: `${httpProtocol}://${url}:${httpPort}`,
  socketUrl: `${socketProtocol}://${url}:${socketPort}`,
};
