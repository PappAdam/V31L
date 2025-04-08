import { Image } from "@prisma/client";
import prisma from "./_db";

export async function createImage(
  imageData: Buffer,
  id?: string
): Promise<Image | null> {
  try {
    const newImg = await prisma.image.create({
      data: {
        id,
        data: imageData,
      },
    });

    return newImg;
  } catch (error) {
    console.error("Error creating image:\n", error);
    return null;
  }
}

export async function findImageById(id: string): Promise<Image | null> {
  try {
    const img = await prisma.image.findUnique({
      where: {
        id,
      },
    });

    return img;
  } catch (error) {
    console.error("Error finding image:\n", error);
    return null;
  }
}
