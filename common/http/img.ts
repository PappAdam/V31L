export type ImageResponse = undefined | EncryptedImage;

export type EncryptedImage = {
  data: string;
  iv?: string;
  type: string;
};
