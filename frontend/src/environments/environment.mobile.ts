const url = '192.168.50.15';
const httpProtocol = 'http';
const httpPort = 3000;
const socketProtocol = 'ws';
const socketPort = 8080;

export const environment = {
  httpUrl: `${httpProtocol}://${url}:${httpPort}`,
  socketUrl: `${socketProtocol}://${url}:${socketPort}`,
};
