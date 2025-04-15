import { Image } from "@prisma/client";
import prisma from "./_db";
import { decryptData, encryptData, EncryptedData } from "@/encryption";
import { arrayToString, EncryptedImage } from "@common";

export async function createImage(
  imageData: Uint8Array,
  type: string,
  id?: string,
  iv?: Uint8Array
): Promise<Image | null> {
  try {
    const encryptedData = encryptData(imageData);

    const newImg = await prisma.image.create({
      data: {
        id,
        data: encryptedData.encrypted,
        type,
        inIv: iv,
        authTag: encryptedData.authTag,
        outIv: encryptedData.iv,
      },
    });

    return newImg;
  } catch (error) {
    console.error("Error creating image:\n", error);
    return null;
  }
}

export async function findImageById(
  id: string
): Promise<EncryptedImage | null> {
  try {
    const img = await prisma.image.findUnique({
      where: {
        id,
      },
    });

    if (!img) {
      return null;
    }

    return {
      data: arrayToString(
        decryptData({
          iv: img.outIv,
          authTag: img.authTag,
          encrypted: img.data,
        })
      ),
      iv: img.inIv ? arrayToString(img.inIv) : undefined,
      type: img.type,
    };
  } catch (error) {
    console.error("Error finding image:\n", error);
    return null;
  }
}
